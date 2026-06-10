import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { conversationChat } from "@/lib/groq/conversation";
import { getScenario } from "@/lib/content/scenarios";
import { getCefrInfo } from "@/lib/content/cefr";
import { enforceLimit } from "@/lib/rate-limit";
import { familyAccess } from "@/lib/billing/access";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  kidId: z.string().uuid(),
  scenarioKey: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(2000),
  })).max(40),
  userMessage: z.string().min(1).max(800),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = enforceLimit(user.id, "conversation");
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Demasiados turnos. Espera ${rl.resetIn}s.`, code: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } },
    );
  }

  const { data: kid } = await supabase
    .from("kid_profiles").select("*").eq("id", body.kidId).single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  // Gate de plan (familia no visible = staff de colegio → plan school, permitido).
  const { data: famRow } = await supabase
    .from("families")
    .select("plan, trial_ends_at")
    .eq("id", kid.family_id)
    .single();
  if (famRow && !familyAccess(famRow).active) {
    return NextResponse.json(
      { error: "Tu período de prueba terminó. Suscríbete para seguir aprendiendo.", code: "paywall" },
      { status: 402 },
    );
  }

  const scenario = getScenario(body.scenarioKey);
  if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

  const cefr = getCefrInfo(kid.total_xp);

  const result = await conversationChat({
    kid: {
      name: kid.name, gender: null, ageDesc: "adolescente",
      grade: kid.grade, hobbies: kid.hobbies, tone: kid.tone,
      familyMembers: [], cefrCode: cefr.code, cefrName: cefr.name, recentTopics: [],
    },
    scenario,
    history: body.history,
    userMessage: body.userMessage,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

  await supabase.from("usage_events").insert({
    family_id: kid.family_id,
    kid_id: kid.id,
    event_type: "llm_chat",
    tokens_used: result.tokensUsed,
    cost_usd_cents: Math.ceil((result.tokensUsed / 1_000_000) * 59),
  });

  return NextResponse.json({ reply: result.reply });
}
