import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeStats, computeStreakDays, computeSkillBreakdown } from "@/lib/pedagogy/stats";
import { verifyParentPassword } from "@/lib/parent-auth";

export const runtime = "nodejs";

const BodySchema = z.object({
  password: z.string().min(1),
});

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
      .select("lesson_type, world_key, skill, score_pct, xp_gained, created_at")
      .eq("kid_id", kid.id);

    const stats = computeStats(sessions ?? []);
    const streak = computeStreakDays(sessions ?? []);
    const skills = computeSkillBreakdown(sessions ?? []);
    const weekXp = (sessions ?? [])
      .filter((s) => new Date(s.created_at).getTime() > Date.now() - 7 * 86_400_000)
      .reduce((acc, s) => acc + (s.xp_gained ?? 0), 0);
    const avgScore = stats.totalSessions
      ? (sessions ?? []).reduce((acc, s) => acc + (s.score_pct ?? 0) / 100, 0) / stats.totalSessions
      : 0;

    const weakSkill = Object.entries(skills).sort((a, b) => a[1].sessions - b[1].sessions)[0]?.[0] ?? null;

    return {
      kid,
      weekXp,
      totalSessions: stats.totalSessions,
      avgScore,
      streak,
      weakSkill,
    };
  }));

  return NextResponse.json({ kids: out });
}
