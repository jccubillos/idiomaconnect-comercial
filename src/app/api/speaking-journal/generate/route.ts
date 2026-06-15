import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateJournalPrompt } from "@/lib/groq/writing-prompts";
import { getCefrInfo } from "@/lib/content/cefr";
import { parseBody } from "@/lib/api/parse-body";
import { enforceLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({ kidId: z.string().uuid(), world: z.string().optional() });

export async function POST(req: Request) {
  const body = await parseBody(req, Body);
  if (body instanceof NextResponse) return body;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await enforceLimit(user.id, "llmGenerate");
  if (!rl.ok) return NextResponse.json({ error: "Cuota alcanzada", code: "rate_limit" }, { status: 429 });

  const { data: kid } = await supabase.from("kid_profiles").select("*").eq("id", body.kidId).single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  // Si viene del mundo del colegio, el tema a hablar se ancla al tema del curso.
  let theme: string | undefined;
  if (body.world === "school_world" && kid.course_id) {
    const { data: course } = await supabase.from("courses").select("current_theme").eq("id", kid.course_id).single();
    theme = course?.current_theme ?? undefined;
  }
  const cefr = getCefrInfo(kid.total_xp);
  const r = await generateJournalPrompt({
    name: kid.name, gender: null, ageDesc: "adolescente",
    grade: kid.grade, hobbies: kid.hobbies, tone: kid.tone,
    familyMembers: [], cefrCode: cefr.code, cefrName: cefr.name, recentTopics: [],
  }, theme);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 });
  return NextResponse.json({ prompt: r.data });
}
