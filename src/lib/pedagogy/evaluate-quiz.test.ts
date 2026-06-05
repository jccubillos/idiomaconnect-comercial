import { describe, it, expect } from "vitest";
import { evaluateQuiz, calculateXp, XP_PER_LESSON, PASSING_SCORE } from "./evaluate-quiz";

describe("evaluateQuiz", () => {
  const mc = [
    { q: "What is 'cat'?", options: ["gato", "perro", "pez", "ratón"], answer: "gato" },
    { q: "What is 'dog'?", options: ["gato", "perro", "pez", "ratón"], answer: "perro" },
  ];
  const fitb = [
    { sentence: "The cat is on the ___", answer: "table", hint: "El gato está en la mesa" },
  ];

  it("scores all correct", () => {
    const r = evaluateQuiz(mc, fitb, { 0: "gato", 1: "perro" }, { 0: "table" });
    expect(r.correct).toBe(3);
    expect(r.total).toBe(3);
    expect(r.scorePct).toBe(1);
    expect(r.passed).toBe(true);
  });

  it("treats accents as equivalent on FITB", () => {
    const r = evaluateQuiz([], fitb, {}, { 0: "TABLE" });
    expect(r.correct).toBe(1);
  });

  it("counts empty answers as wrong", () => {
    const r = evaluateQuiz(mc, fitb, {}, {});
    expect(r.correct).toBe(0);
    expect(r.passed).toBe(false);
  });

  it("requires PASSING_SCORE to pass", () => {
    const r = evaluateQuiz(mc, fitb, { 0: "gato", 1: "wrong" }, { 0: "wrong" });
    expect(r.scorePct).toBeCloseTo(1 / 3, 2);
    expect(r.passed).toBe(false);
    expect(r.scorePct).toBeLessThan(PASSING_SCORE);
  });
});

describe("calculateXp", () => {
  it("returns 0 below the passing threshold", () => {
    expect(calculateXp(0)).toBe(0);
    expect(calculateXp(0.5)).toBe(0);
  });

  it("returns max XP at 100%", () => {
    expect(calculateXp(1)).toBe(XP_PER_LESSON);
  });

  it("scales linearly between passing and 100%", () => {
    const xp80 = calculateXp(0.8);
    const xp90 = calculateXp(0.9);
    expect(xp80).toBeGreaterThan(0);
    expect(xp80).toBeLessThan(XP_PER_LESSON);
    expect(xp90).toBeGreaterThan(xp80);
  });
});
