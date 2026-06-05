import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/groq/transcribe";
import { scorePronunciation } from "@/lib/pedagogy/pronunciation";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Receives audio + target word, returns transcript + score.
 * Used by the Pronunciation page.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const audio = form.get("audio");
  const target = form.get("target");
  const kidId = form.get("kidId");

  if (!(audio instanceof Blob) || typeof target !== "string" || typeof kidId !== "string") {
    return NextResponse.json({ error: "Missing audio/target/kidId" }, { status: 400 });
  }
  if (audio.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio too large" }, { status: 413 });
  }

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, family_id")
    .eq("id", kidId)
    .single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  const transcribed = await transcribeAudio(audio, { language: "en" });
  if (!transcribed.ok) {
    return NextResponse.json({ error: transcribed.error }, { status: 502 });
  }

  const score = scorePronunciation(target, transcribed.text);

  await supabase.from("usage_events").insert({
    family_id: kid.family_id,
    kid_id: kid.id,
    event_type: "whisper_transcribe",
    cost_usd_cents: 1,
  });

  return NextResponse.json({
    transcript: transcribed.text,
    score: score.score,
    feedback: score.feedback,
    charSimilarity: score.charSimilarity,
    wordMatch: score.wordMatch,
    missingWords: score.missingWords,
  });
}
