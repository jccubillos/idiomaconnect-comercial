import { describe, it, expect } from "vitest";
import { computeSchoolStreak } from "./school-streak";

const NOW = new Date("2026-06-11T15:00:00Z");
const D = 86_400_000;

function s(daysAgo: number, xp: number, world = "school_world") {
  return {
    world_key: world,
    xp_gained: xp,
    created_at: new Date(NOW.getTime() - daysAgo * D).toISOString(),
  };
}

describe("computeSchoolStreak — racha del mundo del colegio (≥100 XP/día)", () => {
  it("3 días seguidos con ≥100 XP → racha 3", () => {
    const sessions = [s(0, 120), s(1, 100), s(2, 150)];
    expect(computeSchoolStreak(sessions, NOW)).toBe(3);
  });

  it("suma varias sesiones del mismo día para llegar a 100", () => {
    const sessions = [s(0, 60), s(0, 50), s(1, 110)];
    expect(computeSchoolStreak(sessions, NOW)).toBe(2);
  });

  it("un día bajo 100 XP corta la racha", () => {
    const sessions = [s(0, 120), s(1, 80), s(2, 150)];
    expect(computeSchoolStreak(sessions, NOW)).toBe(1);
  });

  it("si hoy aún no cumple pero ayer sí, la racha sigue viva (ancla en ayer)", () => {
    const sessions = [s(0, 30), s(1, 120), s(2, 100)];
    expect(computeSchoolStreak(sessions, NOW)).toBe(2);
  });

  it("solo cuentan sesiones del mundo del colegio", () => {
    const sessions = [s(0, 500, "grammar"), s(0, 40), s(1, 120)];
    expect(computeSchoolStreak(sessions, NOW)).toBe(1); // hoy no llega (40), ayer sí
  });

  it("sin práctica reciente → 0", () => {
    expect(computeSchoolStreak([s(5, 300)], NOW)).toBe(0);
    expect(computeSchoolStreak([], NOW)).toBe(0);
  });
});
