import { describe, it, expect } from "vitest";
import { scorePronunciation } from "./pronunciation";

describe("scorePronunciation", () => {
  it("scores perfect match as 100", () => {
    const r = scorePronunciation("hello world", "hello world");
    expect(r.score).toBe(100);
    expect(r.feedback).toBe("excellent");
    expect(r.missingWords).toEqual([]);
  });

  it("normalizes case, punctuation and accents", () => {
    const r = scorePronunciation("Hello, World!", "héllo wörld");
    expect(r.score).toBeGreaterThan(80);
  });

  it("penalizes a totally different transcript", () => {
    const r = scorePronunciation("butterfly", "completely off");
    expect(r.score).toBeLessThan(50);
    expect(r.feedback).toBe("poor");
  });

  it("identifies missing words", () => {
    const r = scorePronunciation("the cat is on the mat", "cat is on");
    expect(r.missingWords).toContain("the");
    expect(r.missingWords).toContain("mat");
  });

  it("handles empty input gracefully", () => {
    const r = scorePronunciation("", "");
    expect(r.score).toBe(0);
  });
});
