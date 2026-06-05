import { describe, it, expect } from "vitest";
import { computeStats, computeStreakDays, computeSkillBreakdown } from "./stats";

function day(d: number): string {
  const t = new Date();
  t.setUTCDate(t.getUTCDate() - d);
  return t.toISOString();
}

const baseSession = {
  lesson_type: "lesson",
  world_key: "vocab",
  skill: "vocabulary",
  xp_gained: 30,
};

describe("computeStats", () => {
  it("aggregates basic counters", () => {
    const sessions = [
      { ...baseSession, score_pct: 90, created_at: day(0) },
      { ...baseSession, score_pct: 100, created_at: day(1) },
      { ...baseSession, score_pct: 50, created_at: day(1), lesson_type: "battle" },
    ];
    const s = computeStats(sessions);
    expect(s.totalSessions).toBe(3);
    expect(s.totalXp).toBe(90);
    expect(s.perfectCount).toBe(1);
    expect(s.activeDays).toBe(2);
    expect(s.battleWins).toBe(0);  // score 50 < 60 = no win
  });

  it("counts battle wins when score >= 60", () => {
    const s = computeStats([
      { ...baseSession, score_pct: 75, lesson_type: "battle", created_at: day(0) },
    ]);
    expect(s.battleWins).toBe(1);
  });

  it("detects consecutive days streak", () => {
    const s = computeStats([
      { ...baseSession, score_pct: null, created_at: day(2) },
      { ...baseSession, score_pct: null, created_at: day(1) },
      { ...baseSession, score_pct: null, created_at: day(0) },
    ]);
    expect(s.maxConsecDays).toBe(3);
  });
});

describe("computeStreakDays", () => {
  it("returns 0 with no sessions", () => {
    expect(computeStreakDays([])).toBe(0);
  });

  it("counts a current streak", () => {
    const sessions = [
      { ...baseSession, score_pct: null, created_at: day(0) },
      { ...baseSession, score_pct: null, created_at: day(1) },
      { ...baseSession, score_pct: null, created_at: day(2) },
    ];
    expect(computeStreakDays(sessions)).toBe(3);
  });

  it("breaks the streak on a missing day", () => {
    const sessions = [
      { ...baseSession, score_pct: null, created_at: day(0) },
      { ...baseSession, score_pct: null, created_at: day(2) }, // gap
      { ...baseSession, score_pct: null, created_at: day(3) },
    ];
    expect(computeStreakDays(sessions)).toBe(1);
  });
});

describe("computeSkillBreakdown", () => {
  it("groups XP and sessions by skill", () => {
    const r = computeSkillBreakdown([
      { ...baseSession, skill: "vocabulary", score_pct: 80, created_at: day(0), xp_gained: 30 },
      { ...baseSession, skill: "vocabulary", score_pct: 100, created_at: day(0), xp_gained: 20 },
      { ...baseSession, skill: "grammar", score_pct: 60, created_at: day(0), xp_gained: 10 },
    ]);
    expect(r.vocabulary.sessions).toBe(2);
    expect(r.vocabulary.xp).toBe(50);
    expect(r.vocabulary.avgScore).toBeCloseTo(0.9);
    expect(r.grammar.sessions).toBe(1);
  });
});
