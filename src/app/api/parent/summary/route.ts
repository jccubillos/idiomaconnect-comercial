import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeStats, computeStreakDays, computeSkillBreakdown } from "@/lib/pedagogy/stats";
import { getCefrInfo } from "@/lib/content/cefr";
import { verifyParentPassword } from "@/lib/parent-auth";

export const runtime = "nodejs";

const BodySchema = z.object({
  password: z.string().min(1),
});

/** Estima horas de práctica para subir al siguiente nivel CEFR. */
function estimateHoursToNextLevel(
  sessions: { xp_gained: number | null; duration_seconds: number | null }[],
  xpToNext: number,
): number | null {
  if (xpToNext <= 0) return null; // ya en el nivel máximo
  const totalSecs = sessions.reduce((a, s) => a + (s.duration_seconds ?? 0), 0);
  const totalXp = sessions.reduce((a, s) => a + (s.xp_gained ?? 0), 0);
  // XP por hora a partir del historial; si hay pocos datos, usa un ritmo razonable.
  let xpPerHour = totalSecs > 300 && totalXp > 0 ? totalXp / (totalSecs / 3600) : 270;
  xpPerHour = Math.min(600, Math.max(60, xpPerHour)); // acota a un rango sensato
  return Math.round((xpToNext / xpPerHour) * 10) / 10; // 1 decimal
}

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  if (!verifyParentPassword(body.password)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: kids = [] } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, color_hex, total_xp, cefr_level, hobbies")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  const out = await Promise.all((kids ?? []).map(async (kid) => {
    const { data: sessions = [] } = await supabase
      .from("lesson_sessions")
      .select("lesson_type, world_key, skill, score_pct, xp_gained, created_at, duration_seconds")
      .eq("kid_id", kid.id);

    const all = sessions ?? [];
    const stats = computeStats(all);
    const streak = computeStreakDays(all);
    const skills = computeSkillBreakdown(all);
    const weekXp = all
      .filter((s) => new Date(s.created_at).getTime() > Date.now() - 7 * 86_400_000)
      .reduce((acc, s) => acc + (s.xp_gained ?? 0), 0);
    const avgScore = stats.totalSessions
      ? all.reduce((acc, s) => acc + (s.score_pct ?? 0) / 100, 0) / stats.totalSessions
      : 0;
    const weakSkill = Object.entries(skills).sort((a, b) => a[1].sessions - b[1].sessions)[0]?.[0] ?? null;

    const cefr = getCefrInfo(kid.total_xp);
    const hoursToNextLevel = estimateHoursToNextLevel(all, cefr.xpToNext);

    // Últimas 10 sesiones (más recientes primero)
    const recentSessions = [...all]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((s) => ({
        worldKey: s.world_key,
        lessonType: s.lesson_type,
        xpGained: s.xp_gained ?? 0,
        scorePct: s.score_pct,
      }));

    return {
      kid,
      weekXp,
      totalSessions: stats.totalSessions,
      avgScore,
      streak,
      weakSkill,
      skills,
      recentSessions,
      hoursToNextLevel,
    };
  }));

  return NextResponse.json({ kids: out });
}
