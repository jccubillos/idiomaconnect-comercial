import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateLesson } from "@/lib/groq/lesson";
import { getCefrInfo } from "@/lib/content/cefr";
import { getUniversalWorld, buildPersonalWorld } from "@/lib/content/worlds";
import { pickCurriculumUnit } from "@/lib/content/curriculum";
import { enforceLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logging/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  kidId: z.string().uuid(),
  worldKey: z.string().default("london_hub"),
  topicOverride: z.string().optional(),
  customContext: z.string().max(500).optional(),
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

  // Rate limit per user/day
  const rl = enforceLimit(user.id, "llmGenerate");
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Cuota diaria alcanzada. Vuelve en ${Math.ceil(rl.resetIn / 60)} min.`, code: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } },
    );
  }

  // 1. Verify kid belongs to this family (RLS would block anyway, but explicit check is clearer)
  const { data: kid, error: kidErr } = await supabase
    .from("kid_profiles")
    .select("*, family_id")
    .eq("id", body.kidId)
    .single();
  if (kidErr || !kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  // 2. Plan/trial gate
  const { data: family } = await supabase
    .from("families")
    .select("plan, trial_ends_at")
    .eq("id", kid.family_id)
    .single();
  if (!family) return NextResponse.json({ error: "Family missing" }, { status: 500 });
  const trialActive = family.plan === "trial" && new Date(family.trial_ends_at) > new Date();
  const subscribed = family.plan === "family_monthly" || family.plan === "family_yearly";
  if (!trialActive && !subscribed) {
    return NextResponse.json({ error: "Subscription required", code: "paywall" }, { status: 402 });
  }

  // 3. Family members for prompt
  const { data: members = [] } = await supabase
    .from("family_members")
    .select("relation, name, age, notes")
    .eq("family_id", kid.family_id);

  // 4. Recent topics for memory block
  const { data: recent = [] } = await supabase
    .from("lesson_sessions")
    .select("topic")
    .eq("kid_id", kid.id)
    .order("created_at", { ascending: false })
    .limit(15);

  // 5. Pick world
  let world: { key: string; name: string; tagline: string; topic: string };
  if (body.worldKey === "personal") {
    const pw = buildPersonalWorld({
      kidName: kid.name,
      hobbies: kid.hobbies,
      color: kid.color_hex,
      emoji: kid.emoji,
    });
    world = { key: pw.key, name: pw.name, tagline: pw.tagline, topic: pw.topic };
  } else {
    const uw = getUniversalWorld(body.worldKey) ?? getUniversalWorld("london_hub")!;
    world = { key: uw.key, name: uw.name, tagline: uw.tagline, topic: uw.topic };
  }

  const cefr = getCefrInfo(kid.total_xp);

  // Currículum (columna vertebral): elige la unidad a enseñar según el nivel y el
  // nº de lecciones clásicas hechas, para avanzar EN ORDEN por el plan de estudios.
  const { count: lessonCount } = await supabase
    .from("lesson_sessions")
    .select("id", { count: "exact", head: true })
    .eq("kid_id", kid.id)
    .eq("lesson_type", "lesson");
  const objective = pickCurriculumUnit(cefr.code, lessonCount ?? 0);

  // 6. Call Groq (objetivo CURADO + entrega personalizada por IA = híbrido)
  const result = await generateLesson({
    kid: {
      name: kid.name,
      gender: null, // privacy: not stored. Could be added later from kid_profiles.
      ageDesc: kid.birth_date
        ? `${Math.max(5, Math.floor((Date.now() - new Date(kid.birth_date).getTime()) / 31557600000))} años`
        : "adolescente",
      grade: kid.grade,
      hobbies: kid.hobbies,
      tone: kid.tone,
      familyMembers: (members ?? []).map((m) => ({
        relation: m.relation,
        name: m.name,
        age: m.age,
        notes: m.notes,
      })),
      cefrCode: cefr.code,
      cefrName: cefr.name,
      recentTopics: (recent ?? []).map((r) => r.topic).filter(Boolean) as string[],
    },
    world: { key: world.key, name: world.name, tagline: world.tagline },
    topic: body.topicOverride ?? world.topic,
    customContext: body.customContext ?? null,
    objective,
  });

  if (!result.ok) {
    log.warn("lessons.generate.failed", { code: result.code, worldKey: body.worldKey });
    return NextResponse.json({ error: result.error, code: result.code }, { status: 503 });
  }
  log.info("lessons.generate.ok", { worldKey: body.worldKey, tokensUsed: result.tokensUsed });

  // 7. Log usage (cost control)
  await supabase.from("usage_events").insert({
    family_id: kid.family_id,
    kid_id: kid.id,
    event_type: "lesson_generate",
    tokens_used: result.tokensUsed,
    // ~$0.59 per 1M tokens for llama-3.3-70b on Groq (oct 2024)
    cost_usd_cents: Math.ceil((result.tokensUsed / 1_000_000) * 59),
  });

  return NextResponse.json({
    lesson: result.data,
    world: { key: world.key, name: world.name },
    cefr: { code: cefr.code, name: cefr.name, progress: cefr.progress },
  });
}
