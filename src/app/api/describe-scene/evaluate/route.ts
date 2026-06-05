import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { evaluateProduction } from "@/lib/groq/writing-eval";
import { getCefrInfo } from "@/lib/content/cefr";
import { parseBody } from "@/lib/api/parse-body";
import { enforceLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  kidId: z.string().uuid(),
  sceneEs: z.string().min(1).max(800),
  userEn: z.string().min(1).max(1500),
});

export async function POST(req: Request) {
  const body = await parseBody(req, Body);
  if (body instanceof NextResponse) return body;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = enforceLimit(user.id, "llmGenerate");
  if (!rl.ok) return NextResponse.json({ error: "Cuota alcanzada", code: "rate_limit" }, { status: 429 });
  const { data: kid } = await supabase.from("kid_profiles").select("*").eq("id", body.kidId).single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });
  const cefr = getCefrInfo(kid.total_xp);
  const r = await evaluateProduction({
    kid: {
      name: kid.name, gender: null, ageDesc: "adolescente",
      grade: kid.grade, hobbies: kid.hobbies, tone: kid.tone,
      familyMembers: [], cefrCode: cefr.code, cefrName: cefr.name, recentTopics: [],
    },
    taskType: "describe_scene",
    promptOrSource: body.sceneEs,
    userOutput: body.userEn,
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 });
  return NextResponse.json({ evaluation: r.data });
}
