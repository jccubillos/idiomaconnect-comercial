import { describe, it, expect } from "vitest";
import { getCefrInfo, CEFR_LEVELS, cefrThreshold, placementXp, effectiveCefrInfo } from "./cefr";
import { unitsForLevel } from "./curriculum";

describe("getCefrInfo", () => {
  it("returns A1 for 0 XP", () => {
    expect(getCefrInfo(0).code).toBe("A1");
  });

  it("returns A2 right at the threshold", () => {
    const a2 = CEFR_LEVELS.find((l) => l.code === "A2")!;
    expect(getCefrInfo(a2.threshold).code).toBe("A2");
  });

  it("returns C2 well above the C2 threshold", () => {
    expect(getCefrInfo(99_999).code).toBe("C2");
  });

  it("reports progress 0 right after promotion and ~1 close to the next level", () => {
    const a2 = CEFR_LEVELS.find((l) => l.code === "A2")!;
    const b1 = CEFR_LEVELS.find((l) => l.code === "B1")!;
    const halfway = Math.round((a2.threshold + b1.threshold) / 2);
    const r = getCefrInfo(halfway);
    expect(r.code).toBe("A2");
    expect(r.progress).toBeGreaterThan(0.3);
    expect(r.progress).toBeLessThan(0.7);
  });

  it("flags max level at C2", () => {
    const r = getCefrInfo(10_000);
    expect(r.code).toBe("C2");
    expect(r.progress).toBe(1);
    expect(r.nextLabel).toContain("máximo");
  });
});

describe("cefrThreshold", () => {
  it("returns the configured threshold for each level", () => {
    expect(cefrThreshold("A1")).toBe(0);
    expect(cefrThreshold("B1")).toBe(CEFR_LEVELS.find((l) => l.code === "B1")!.threshold);
  });
});

describe("placementXp (diagnóstico)", () => {
  it("sube el XP al umbral del nivel diagnosticado cuando el alumno está por debajo", () => {
    const b1 = cefrThreshold("B1");
    expect(placementXp(0, "B1")).toBe(b1);
    expect(getCefrInfo(placementXp(0, "B1")).code).toBe("B1");
  });

  it("NUNCA baja a un alumno que ya está más avanzado (es un piso)", () => {
    const advanced = cefrThreshold("C1") + 50;
    // Diagnóstico sugiere A2 pero el alumno ya está en C1 → se queda en C1.
    expect(placementXp(advanced, "A2")).toBe(advanced);
    expect(getCefrInfo(placementXp(advanced, "A2")).code).toBe("C1");
  });

  it("colocar en A1 con 0 XP no cambia nada", () => {
    expect(placementXp(0, "A1")).toBe(0);
  });
});

describe("effectiveCefrInfo (doble exigencia)", () => {
  const a1Units = unitsForLevel("A1").length;

  it("con XP de A2 pero sin unidades de A1 completadas, queda capado en A1", () => {
    const a2 = cefrThreshold("A2");
    const r = effectiveCefrInfo(a2, 0);
    expect(r.code).toBe("A1");
    expect(r.blockedByCurriculum).toBe(true);
  });

  it("con XP de A2 Y todas las unidades de A1 hechas, sube a A2", () => {
    const a2 = cefrThreshold("A2");
    const r = effectiveCefrInfo(a2, a1Units);
    expect(r.code).toBe("A2");
    expect(r.blockedByCurriculum).toBe(false);
  });

  it("el piso (diagnóstico) impide que la doble exigencia baje el nivel", () => {
    const b1 = cefrThreshold("B1");
    // Ubicado en B1 por diagnóstico, sin lecciones de gramática: NO baja a A1.
    const r = effectiveCefrInfo(b1, 0, "B1");
    expect(r.code).toBe("B1");
    expect(r.blockedByCurriculum).toBe(false);
  });
});
