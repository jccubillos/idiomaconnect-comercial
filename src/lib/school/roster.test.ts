import { describe, it, expect } from "vitest";
import {
  summarizeStudent,
  aggregateCourse,
  lastActiveLabel,
  type StudentSessionLite,
} from "./roster";

const NOW = new Date("2026-06-07T12:00:00Z");

function session(kidId: string, daysAgo: number, score: number, xp = 20): StudentSessionLite {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return {
    kid_id: kidId,
    skill: "vocabulary",
    world_key: "vocab",
    lesson_type: "lesson",
    score_pct: score,
    xp_gained: xp,
    created_at: d.toISOString(),
  };
}

describe("summarizeStudent", () => {
  it("solo cuenta las sesiones del alumno indicado", () => {
    const sessions = [session("a", 0, 80), session("b", 0, 50), session("a", 1, 60)];
    const s = summarizeStudent("a", 200, sessions, NOW);
    expect(s.sessions).toBe(2);
    expect(s.avgScore).toBe(70); // (80+60)/2
  });

  it("calcula actividad en los últimos 7 días", () => {
    const sessions = [session("a", 1, 90), session("a", 10, 90)];
    const s = summarizeStudent("a", 100, sessions, NOW);
    expect(s.activeLast7).toBe(1);
  });

  it("alumno sin sesiones → métricas en cero y lastActive null", () => {
    const s = summarizeStudent("a", 0, [], NOW);
    expect(s.sessions).toBe(0);
    expect(s.avgScore).toBe(0);
    expect(s.lastActive).toBeNull();
    expect(s.activeLast7).toBe(0);
  });

  it("deriva nivel CEFR del XP total", () => {
    const s = summarizeStudent("a", 0, [], NOW);
    expect(s.cefrCode).toMatch(/^(A1|A2|B1|B2|C1|C2)$/);
  });
});

describe("aggregateCourse", () => {
  it("agrega alumnos activos y promedios", () => {
    const summaries = [
      summarizeStudent("a", 300, [session("a", 1, 80)], NOW),
      summarizeStudent("b", 100, [session("b", 20, 40)], NOW),
      summarizeStudent("c", 0, [], NOW),
    ];
    const agg = aggregateCourse(summaries, 1, 2);
    expect(agg.students).toBe(3);
    expect(agg.activeStudents7).toBe(1); // solo "a" practicó en 7 días
    expect(agg.sessions7).toBe(1);
    expect(agg.totalSessions).toBe(2);
  });
});

describe("lastActiveLabel", () => {
  it("etiqueta hoy/ayer/nunca", () => {
    expect(lastActiveLabel(null, NOW)).toBe("Nunca");
    expect(lastActiveLabel(NOW.toISOString(), NOW)).toBe("Hoy");
    const ayer = new Date(NOW); ayer.setUTCDate(ayer.getUTCDate() - 1);
    expect(lastActiveLabel(ayer.toISOString(), NOW)).toBe("Ayer");
  });
});
