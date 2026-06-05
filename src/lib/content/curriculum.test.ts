import { describe, it, expect } from "vitest";
import { CURRICULUM, unitsForLevel, pickCurriculumUnit } from "./curriculum";

describe("CURRICULUM — integridad del plan de estudios", () => {
  it("cada unidad tiene todos los campos no vacíos", () => {
    for (const u of CURRICULUM) {
      expect(u.id, "id").toBeTruthy();
      expect(u.title.trim(), u.id).toBeTruthy();
      expect(u.canDo.trim(), u.id).toBeTruthy();
      expect(u.grammar.trim(), u.id).toBeTruthy();
      expect(u.vocab.trim(), u.id).toBeTruthy();
    }
  });

  it("los ids son únicos", () => {
    const ids = CURRICULUM.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hay unidades para cada nivel A1..C1", () => {
    for (const lvl of ["A1", "A2", "B1", "B2", "C1"] as const) {
      expect(unitsForLevel(lvl).length, lvl).toBeGreaterThanOrEqual(5);
    }
  });

  it("C2 reutiliza el plan de C1", () => {
    expect(unitsForLevel("C2")).toEqual(unitsForLevel("C1"));
  });
});

describe("pickCurriculumUnit", () => {
  it("avanza EN ORDEN por las unidades del nivel y cicla al terminar", () => {
    const units = unitsForLevel("A1");
    expect(pickCurriculumUnit("A1", 0).id).toBe(units[0].id);
    expect(pickCurriculumUnit("A1", 1).id).toBe(units[1].id);
    expect(pickCurriculumUnit("A1", units.length).id).toBe(units[0].id); // cicla
  });

  it("siempre devuelve una unidad del nivel pedido", () => {
    for (const lvl of ["A1", "A2", "B1", "B2", "C1"] as const) {
      for (let i = 0; i < 20; i++) {
        expect(pickCurriculumUnit(lvl, i).level).toBe(lvl);
      }
    }
  });
});
