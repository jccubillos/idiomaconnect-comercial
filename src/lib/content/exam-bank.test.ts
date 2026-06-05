import { describe, it, expect } from "vitest";
import { EXAM_BANK, buildPlacementExam } from "./exam-bank";

describe("EXAM_BANK — integridad de cada pregunta", () => {
  it("cada pregunta tiene exactamente 4 opciones", () => {
    for (const q of EXAM_BANK) {
      expect(q.options, q.q).toHaveLength(4);
    }
  });

  it("la respuesta correcta está EXACTAMENTE entre las opciones", () => {
    for (const q of EXAM_BANK) {
      expect(q.options, q.q).toContain(q.answer);
    }
  });

  it("las 4 opciones son únicas (evita 'dos respuestas correctas')", () => {
    for (const q of EXAM_BANK) {
      expect(new Set(q.options).size, q.q).toBe(4);
    }
  });

  it("hay al menos 3 preguntas por cada nivel A1..C1", () => {
    for (const lvl of ["A1", "A2", "B1", "B2", "C1"]) {
      expect(EXAM_BANK.filter((q) => q.level === lvl).length, lvl).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("buildPlacementExam", () => {
  it("devuelve 15 preguntas (3 por nivel)", () => {
    const exam = buildPlacementExam();
    expect(exam).toHaveLength(15);
    for (const lvl of ["A1", "A2", "B1", "B2", "C1"]) {
      expect(exam.filter((q) => q.level === lvl)).toHaveLength(3);
    }
  });

  it("tras barajar, la respuesta sigue estando entre las opciones", () => {
    const exam = buildPlacementExam();
    for (const q of exam) {
      expect(q.options).toContain(q.answer);
      expect(q.options).toHaveLength(4);
    }
  });
});
