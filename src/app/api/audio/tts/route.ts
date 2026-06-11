import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { synthesizeSpeech } from "@/lib/tts/provider";
import { enforceLimit } from "@/lib/rate-limit";
import { requireKidAccess } from "@/lib/billing/access";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  text: z.string().min(1).max(4000),
  kidId: z.string().uuid(),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
});

const CACHE_BUCKET = "tts-cache";

/** Clave de caché: misma voz + mismo texto ⇒ mismo audio. */
function cacheKey(voice: string, text: string): string {
  return createHash("sha1").update(`${voice}|${text}`).digest("hex") + ".mp3";
}

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

  const rl = await enforceLimit(user.id, "tts");
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Cuota de audio alcanzada. Vuelve en ${Math.ceil(rl.resetIn / 60)} min.`, code: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } },
    );
  }

  // Gate de plan: kid válido + familia con acceso activo (trial vigente o pago).
  const access = await requireKidAccess(supabase, body.kidId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error, code: access.code }, { status: access.status });
  }
  const kid = access.kid;

  const audioHeaders = {
    "Content-Type": "audio/mpeg",
    "Cache-Control": "private, max-age=3600",
  };

  // ── CACHÉ: si esta frase ya fue sintetizada, se sirve gratis del storage. ──
  const key = cacheKey(body.voice ?? "default", body.text);
  let svc: ReturnType<typeof createServiceClient> | null = null;
  try {
    svc = createServiceClient();
    const { data: cached } = await svc.storage.from(CACHE_BUCKET).download(key);
    if (cached) {
      const buf = await cached.arrayBuffer();
      await supabase.from("usage_events").insert({
        family_id: kid.family_id,
        kid_id: kid.id,
        event_type: "tts_cache_hit",
        tokens_used: body.text.length,
        cost_usd_cents: 0, // ya pagado la primera vez
      });
      return new NextResponse(buf, { headers: { ...audioHeaders, "X-TTS-Cache": "hit" } });
    }
  } catch {
    /* sin service key o bucket aún no migrado → seguimos sin caché */
  }

  // ── MISS: sintetizar, guardar en caché (mejor esfuerzo) y responder. ──
  try {
    const audio = await synthesizeSpeech({ text: body.text, voice: body.voice });

    if (svc) {
      // Mejor esfuerzo: si falla el guardado, la respuesta sale igual.
      try {
        await svc.storage
          .from(CACHE_BUCKET)
          .upload(key, audio, { contentType: "audio/mpeg", upsert: true });
      } catch { /* sin caché esta vez */ }
    }

    await supabase.from("usage_events").insert({
      family_id: kid.family_id,
      kid_id: kid.id,
      event_type: "tts",
      tokens_used: body.text.length, // chars as a proxy
      // OpenAI tts-1 = $15/1M chars => 1.5¢ per 1K chars
      cost_usd_cents: Math.max(1, Math.ceil(body.text.length * 0.0015)),
    });

    return new NextResponse(audio, { headers: { ...audioHeaders, "X-TTS-Cache": "miss" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[tts] error", err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
