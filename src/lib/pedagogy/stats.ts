/**
 * Aggregate kid stats from lesson_sessions and trophies_earned.
 * Pure functions — easy to test, easy to memoize at the cache layer.
 */

import type { KidStats } from "@/lib/content/trophies";

export interface LessonSessionRow {
  lesson_type: string;
  world_key: string | null;
  skill: string | null;
  score_pct: number | null;
  xp_gained: number;
  created_at: string;
}

export function computeStats(sessions: LessonSessionRow[]): KidStats {
  const totalSessions = sessions.length;
  const totalXp = sessions.reduce((acc, s) => acc + (s.xp_gained ?? 0), 0);
  const perfectCount = sessions.filter((s) => (s.score_pct ?? 0) >= 100).length;
  const pronunciationCount = sessions.filter((s) => s.lesson_type === "pronunciation").length;
  const conversationCount = sessions.filter((s) => s.lesson_type === "conversation").length;
  const srsReviewCount = sessions.filter((s) => s.lesson_type === "srs_review").length;
  const battleWins = sessions.filter(
    (s) => s.lesson_type === "battle" && (s.score_pct ?? 0) >= 60,
  ).length;
  const uniqueWorldsVisited = new Set(sessions.map((s) => s.world_key).filter(Boolean)).size;

  // Active days + max consecutive streak (UTC date keys)
  const days = new Set(sessions.map((s) => s.created_at.slice(0, 10)));
  const activeDays = days.size;
  const sortedDays = Array.from(days).sort();
  let maxConsec = 0;
  let curConsec = 0;
  let prevDay: Date | null = null;
  for (const d of sortedDays) {
    const cur = new Date(d + "T00:00:00Z");
    if (prevDay) {
      const diff = (cur.getTime() - prevDay.getTime()) / 86_400_000;
      if (diff === 1) curConsec += 1;
      else curConsec = 1;
    } else {
      curConsec = 1;
    }
    if (curConsec > maxConsec) maxConsec = curConsec;
    prevDay = cur;
  }

  return {
    totalSessions,
    totalXp,
    perfectCount,
    activeDays,
    maxConsecDays: maxConsec,
    battleWins,
    uniqueWorldsVisited,
    pronunciationCount,
    conversationCount,
    srsReviewCount,
  };
}

export function computeStreakDays(sessions: LessonSessionRow[], now: Date = new Date()): number {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map((s) => s.created_at.slice(0, 10)));
  let streak = 0;
  const today = now;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streak += 1;
    else if (i > 0) break;
  }
  return streak;
}

export function computeSkillBreakdown(
  sessions: LessonSessionRow[],
): Record<string, { xp: number; sessions: number; avgScore: number }> {
  const out: Record<string, { xp: number; sessions: number; sumScore: number }> = {};
  for (const s of sessions) {
    const skill = s.skill ?? "general";
    if (!out[skill]) out[skill] = { xp: 0, sessions: 0, sumScore: 0 };
    out[skill].xp += s.xp_gained ?? 0;
    out[skill].sessions += 1;
    out[skill].sumScore += (s.score_pct ?? 0) / 100;
  }
  return Object.fromEntries(
    Object.entries(out).map(([k, v]) => [
      k,
      { xp: v.xp, sessions: v.sessions, avgScore: v.sessions ? v.sumScore / v.sessions : 0 },
    ]),
  );
}
