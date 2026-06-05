import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/groq/transcribe";
import { enforceLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = enforceLimit(user.id, "whisper");
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Demasiadas transcripciones. Espera ${Math.ceil(rl.resetIn / 60)} min.`, code: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } },
    );
  }

  const form = await req.formData();
  const audio = form.get("audio");
  const kidId = form.get("kidId");
  const language = (form.get("language") ?? "en") as "en" | "es";

  if (!(audio instanceof Blob) || typeof kidId !== "string") {
    return NextResponse.json({ error: "Missing audio or kidId" }, { status: 400 });
  }
  if (audio.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio too large (>10MB)" }, { status: 413 });
  }

  // Verify kid ownership via RLS-aware query
  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, family_id")
    .eq("id", kidId)
    .single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  const result = await transcribeAudio(audio, { language });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  await supabase.from("usage_events").insert({
    family_id: kid.family_id,
    kid_id: kid.id,
    event_type: "whisper_transcribe",
    // Whisper Groq pricing ~$0.04/hour audio. Estimate by blob size as rough proxy.
    cost_usd_cents: Math.max(1, Math.round(audio.size / 1024 / 100)),
  });

  return NextResponse.json({ text: result.text });
}
