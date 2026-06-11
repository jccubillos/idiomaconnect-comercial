import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateBattle } from "@/lib/groq/vocab-battle";
import { getUniversalWorld, buildPersonalWorld } from "@/lib/content/worlds";
import { getCefrInfo } from "@/lib/content/cefr";
import { enforceLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  kidId: z.string().uuid(),
  worldKey: z.string().default("vocab"),
  rounds: z.number().int().min(4).max(12).default(8),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await enforceLimit(user.id, "llmGenerate");
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Cuota diaria alcanzada. Vuelve en ${Math.ceil(rl.resetIn / 60)} min.`, code: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } },
    );
  }

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("*")
    .eq("id", body.kidId)
    .single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  const cefr = getCefrInfo(kid.total_xp);
  const world =
    body.worldKey === "personal"
      ? buildPersonalWorld({ kidName: kid.name, hobbies: kid.hobbies, color: kid.color_hex, emoji: kid.emoji })
      : getUniversalWorld(body.worldKey) ?? getUniversalWorld("vocab")!;

  const result = await generateBattle({
    kid: {
      name: kid.name,
      gender: null,
      ageDesc: "adolescente",
      grade: kid.grade,
      hobbies: kid.hobbies,
      tone: kid.tone,
      familyMembers: [],
      cefrCode: cefr.code,
      cefrName: cefr.name,
      recentTopics: [],
    },
    world: { key: world.key, name: world.name, tagline: world.tagline },
    rounds: body.rounds,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

  await supabase.from("usage_events").insert({
    family_id: kid.family_id,
    kid_id: kid.id,
    event_type: "llm_chat",
    tokens_used: result.tokensUsed,
    cost_usd_cents: Math.ceil((result.tokensUsed / 1_000_000) * 59),
  });

  return NextResponse.json({ rounds: result.data.rounds });
}
