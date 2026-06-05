import { describe, it, expect } from "vitest";
import { evaluateTrophies, TROPHY_CATALOG, type KidStats } from "./trophies";

const empty: KidStats = {
  totalSessions: 0, totalXp: 0, perfectCount: 0,
  activeDays: 0, maxConsecDays: 0, battleWins: 0,
  uniqueWorldsVisited: 0, pronunciationCount: 0,
  conversationCount: 0, srsReviewCount: 0,
};

describe("evaluateTrophies", () => {
  it("returns one entry per trophy in catalog", () => {
    const r = evaluateTrophies(empty);
    expect(r).toHaveLength(TROPHY_CATALOG.length);
  });

  it("marks nothing earned for an empty profile", () => {
    const r = evaluateTrophies(empty);
    expect(r.every((t) => !t.earned)).toBe(true);
  });

  it("awards first_step after one session", () => {
    const r = evaluateTrophies({ ...empty, totalSessions: 1 });
    expect(r.find((t) => t.key === "first_step")!.earned).toBe(true);
  });

  it("awards xp_500 at exactly 500 XP", () => {
    const r = evaluateTrophies({ ...empty, totalXp: 500, totalSessions: 1 });
    expect(r.find((t) => t.key === "xp_500")!.earned).toBe(true);
    expect(r.find((t) => t.key === "xp_1000")!.earned).toBe(false);
  });

  it("awards streak trophies based on max consecutive days", () => {
    const r = evaluateTrophies({ ...empty, maxConsecDays: 7, totalSessions: 7 });
    expect(r.find((t) => t.key === "streak_3d")!.earned).toBe(true);
    expect(r.find((t) => t.key === "streak_7d")!.earned).toBe(true);
  });
});
