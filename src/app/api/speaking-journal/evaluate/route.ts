import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/groq/transcribe";
import { evaluateProduction } from "@/lib/groq/writing-eval";
import { getCefrInfo } from "@/lib/content/cefr";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const audio = form.get("audio");
  const kidId = form.get("kidId");
  const promptEn = form.get("promptEn");
  if (!(audio instanceof Blob) || typeof kidId !== "string" || typeof promptEn !== "string") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (audio.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio too large" }, { status: 413 });
  }

  const { data: kid } = await supabase.from("kid_profiles").select("*").eq("id", kidId).single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  const t = await transcribeAudio(audio, { language: "en" });
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: 502 });

  const cefr = getCefrInfo(kid.total_xp);
  const evalRes = await evaluateProduction({
    kid: {
      name: kid.name, gender: null, ageDesc: "adolescente",
      grade: kid.grade, hobbies: kid.hobbies, tone: kid.tone,
      familyMembers: [], cefrCode: cefr.code, cefrName: cefr.name, recentTopics: [],
    },
    taskType: "speaking_journal",
    promptOrSource: promptEn,
    userOutput: t.text,
  });
  if (!evalRes.ok) return NextResponse.json({ error: evalRes.error }, { status: 502 });

  await supabase.from("usage_events").insert({
    family_id: kid.family_id, kid_id: kid.id, event_type: "whisper_transcribe", cost_usd_cents: 2,
  });

  return NextResponse.json({ transcript: t.text, evaluation: evalRes.data });
}
