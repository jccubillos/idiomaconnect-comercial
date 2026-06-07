import { describe, it, expect } from "vitest";
import { getCoachPlan, type CoachInput } from "./coach";
import type { LessonSessionRow } from "@/lib/pedagogy/stats";

const NOW = new Date("2026-06-06T12:00:00Z");
const TODAY = "2026-06-06";

function session(partial: Partial<LessonSessionRow>): LessonSessionRow {
  return {
    lesson_type: "lesson",
    world_key: "grammar",
    skill: "grammar",
    score_pct: 80,
    xp_gained: 30,
    created_at: `${TODAY}T10:00:00Z`,
    ...partial,
  };
}

function baseInput(overrides: Partial<CoachInput> = {}): CoachInput {
  return {
    kidId: "kid-1",
    kidName: "Sofía",
    cefrCode: "A1",
    sessions: [],
    srsDueCount: 0,
    now: NOW,
    ...overrides,
  };
}

describe("getCoachPlan — Misión del Día", () => {
  it("genera 3 tareas de habilidades distintas (anti-grindeo)", () => {
    const { mission } = getCoachPlan(baseInput());
    expect(mission.total).toBe(3);
    const skills = mission.tasks.map((t) => t.skill);
    expect(new Set(skills).size).toBe(3);
  });

  it("incluye el repaso SRS primero cuando hay tarjetas pendientes", () => {
    const { mission } = getCoachPlan(baseInput({ srsDueCount: 5 }));
    expect(mission.tasks[0].skill).toBe("review");
    expect(mission.tasks[0].route).toBe("srs");
  });

  it("no sugiere actividades bloqueadas por nivel (writing/journal son A2+) en A1", () => {
    const { mission } = getCoachPlan(baseInput({ cefrCode: "A1" }));
    const routes = mission.tasks.map((t) => t.route);
    expect(routes).not.toContain("translate-inverse");
    expect(routes).not.toContain("speaking-journal");
    expect(routes).not.toContain("describe-scene");
  });

  it("prioriza la habilidad más descuidada", () => {
    // Mucha gramática practicada → gramática NO debería estar entre lo sugerido primero.
    const sessions = Array.from({ length: 10 }, () =>
      session({ skill: "grammar", created_at: "2026-06-01T10:00:00Z" }),
    );
    const { mission } = getCoachPlan(baseInput({ sessions }));
    const skills = mission.tasks.map((t) => t.skill);
    // Hay habilidades sin practicar (vocab, listening, speaking, reading) que deben ir antes.
    expect(skills).not.toContain("grammar");
  });

  it("es determinista para el mismo día y niño", () => {
    const a = getCoachPlan(baseInput());
    const b = getCoachPlan(baseInput());
    expect(a.mission.tasks.map((t) => t.id)).toEqual(b.mission.tasks.map((t) => t.id));
  });

  it("marca una tarea como hecha si hoy hubo una sesión de esa habilidad", () => {
    // Primero veo qué habilidad propone, luego simulo una sesión de hoy de esa habilidad.
    const proposed = getCoachPlan(baseInput()).mission.tasks[0];
    const sessions = [session({ skill: proposed.skill as LessonSessionRow["skill"], created_at: `${TODAY}T09:00:00Z` })];
    const { mission } = getCoachPlan(baseInput({ sessions }));
    const matched = mission.tasks.find((t) => t.skill === proposed.skill);
    expect(matched?.done).toBe(true);
  });
});

describe("getCoachPlan — mensaje de Lumi", () => {
  it("celebra cuando la misión está completa", () => {
    // Cubrimos las 3 habilidades sugeridas con sesiones de hoy.
    const proposed = getCoachPlan(baseInput()).mission.tasks;
    const sessions = proposed.map((t) =>
      t.skill === "review"
        ? session({ lesson_type: "srs_review", skill: "vocabulary", created_at: `${TODAY}T09:00:00Z` })
        : session({ skill: t.skill as LessonSessionRow["skill"], created_at: `${TODAY}T09:00:00Z` }),
    );
    const plan = getCoachPlan(baseInput({ sessions }));
    expect(plan.mission.doneCount).toBe(plan.mission.total);
    expect(plan.lumi.mood).toBe("celebrate");
  });

  it("anima a no perder la racha si hoy no ha practicado", () => {
    // Racha de ayer (sin sesión hoy) → mood encourage + CTA a la primera tarea.
    const sessions = [session({ created_at: "2026-06-05T10:00:00Z" })];
    const plan = getCoachPlan(baseInput({ sessions }));
    expect(plan.lumi.mood).toBe("encourage");
    expect(plan.lumi.cta).not.toBeNull();
  });

  it("saluda (greet) a un niño sin racha ni práctica hoy", () => {
    const plan = getCoachPlan(baseInput());
    expect(plan.lumi.mood).toBe("greet");
    expect(plan.lumi.cta?.href).toContain("kid=kid-1");
  });
});
