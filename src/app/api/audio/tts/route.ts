import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { synthesizeSpeech } from "@/lib/tts/provider";
import { enforceLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  text: z.string().min(1).max(4000),
  kidId: z.string().uuid(),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = enforceLimit(user.id, "tts");
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Cuota de audio alcanzada. Vuelve en ${Math.ceil(rl.resetIn / 60)} min.`, code: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } },
    );
  }

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, family_id")
    .eq("id", body.kidId)
    .single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  try {
    const audio = await synthesizeSpeech({ text: body.text, voice: body.voice });

    await supabase.from("usage_events").insert({
      family_id: kid.family_id,
      kid_id: kid.id,
      event_type: "tts",
      tokens_used: body.text.length, // chars as a proxy
      // OpenAI tts-1 = $15/1M chars => 1.5¢ per 1K chars
      cost_usd_cents: Math.max(1, Math.ceil(body.text.length * 0.0015)),
    });

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[tts] error", err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
