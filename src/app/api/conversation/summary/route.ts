import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { summarizeConversation } from "@/lib/groq/conversation";
import { getScenario } from "@/lib/content/scenarios";
import { getCefrInfo } from "@/lib/content/cefr";

export const runtime = "nodejs";

const BodySchema = z.object({
  kidId: z.string().uuid(),
  scenarioKey: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).min(2),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: kid } = await supabase
    .from("kid_profiles").select("*").eq("id", body.kidId).single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  const scenario = getScenario(body.scenarioKey);
  if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

  const cefr = getCefrInfo(kid.total_xp);

  const result = await summarizeConversation({
    kid: {
      name: kid.name, gender: null, ageDesc: "adolescente",
      grade: kid.grade, hobbies: kid.hobbies, tone: kid.tone,
      familyMembers: [], cefrCode: cefr.code, cefrName: cefr.name, recentTopics: [],
    },
    scenario,
    history: body.history,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ summary: result.data });
}
