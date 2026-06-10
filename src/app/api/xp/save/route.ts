import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { effectiveCefrInfo } from "@/lib/content/cefr";
import { evaluateTrophies } from "@/lib/content/trophies";
import { computeStats } from "@/lib/pedagogy/stats";

export const runtime = "nodejs";

const BodySchema = z.object({
  kidId: z.string().uuid(),
  lessonType: z.string().min(1),
  worldKey: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  skill: z.enum(["vocabulary", "grammar", "listening", "speaking", "writing", "reading"]).nullable().optional(),
  scorePct: z.number().min(0).max(100).nullable().optional(),
  xpGained: z.number().int().min(0).max(500),
  attempts: z.number().int().min(1).max(10).default(1),
  durationSeconds: z.number().int().min(0).optional(),
  rawPayload: z.unknown().optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: String(e) }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Insert the session row (RLS enforces ownership)
  const { error: insertErr } = await supabase.from("lesson_sessions").insert({
    kid_id: body.kidId,
    world_key: body.worldKey ?? null,
    lesson_type: body.lessonType,
    topic: body.topic ?? null,
    skill: body.skill ?? null,
    score_pct: body.scorePct ?? null,
    xp_gained: body.xpGained,
    attempts: body.attempts,
    duration_seconds: body.durationSeconds ?? null,
    raw_payload: (body.rawPayload ?? null) as never,
  });
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // 2. Bump kid total_xp and possibly cefr_level
  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, total_xp")
    .eq("id", body.kidId)
    .single();
  if (!kid) return NextResponse.json({ error: "Kid disappeared" }, { status: 404 });

  const newTotal = kid.total_xp + body.xpGained;

  // DOBLE EXIGENCIA para ascender: XP + haber recorrido las unidades del nivel.
  // El nivel guardado se capa por el avance del currículo (lecciones de gramática).
  const { count: grammarCount } = await supabase
    .from("lesson_sessions")
    .select("id", { count: "exact", head: true })
    .eq("kid_id", body.kidId)
    .eq("world_key", "grammar");
  const cefr = effectiveCefrInfo(newTotal, grammarCount ?? 0);

  await supabase
    .from("kid_profiles")
    .update({ total_xp: newTotal, cefr_level: cefr.code })
    .eq("id", body.kidId);

  // 3. Evaluate trophies & award newly earned
  const { data: allSessions = [] } = await supabase
    .from("lesson_sessions")
    .select("lesson_type, world_key, skill, score_pct, xp_gained, created_at")
    .eq("kid_id", body.kidId);

  const stats = computeStats(allSessions ?? []);
  const earnedTrophies = evaluateTrophies(stats).filter((t) => t.earned);

  if (earnedTrophies.length) {
    // Upsert (unique on (kid_id, trophy_key))
    await supabase.from("trophies_earned").upsert(
      earnedTrophies.map((t) => ({ kid_id: body.kidId, trophy_key: t.key })),
      { onConflict: "kid_id,trophy_key", ignoreDuplicates: true },
    );
  }

  return NextResponse.json({
    totalXp: newTotal,
    cefr: { code: cefr.code, name: cefr.name, progress: cefr.progress, nextLabel: cefr.nextLabel },
    // true = tiene el XP para subir pero le faltan unidades del nivel por completar.
    blockedByCurriculum: cefr.blockedByCurriculum,
    trophiesEarnedCount: earnedTrophies.length,
  });
}
