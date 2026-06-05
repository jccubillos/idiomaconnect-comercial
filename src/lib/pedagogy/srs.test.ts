import { describe, it, expect } from "vitest";
import { applySm2, isDue } from "./srs";

describe("applySm2", () => {
  const baseState = {
    intervalDays: 1,
    easeFactor: 2.5,
    repetition: 0,
    dueAt: new Date(),
  };

  it("resets on failed recall (quality < 3)", () => {
    const next = applySm2({ ...baseState, repetition: 5, intervalDays: 30 }, 1);
    expect(next.repetition).toBe(0);
    expect(next.intervalDays).toBe(1);
  });

  it("sets interval to 1 day on first success", () => {
    const next = applySm2(baseState, 5);
    expect(next.repetition).toBe(1);
    expect(next.intervalDays).toBe(1);
  });

  it("sets interval to 6 days on second success", () => {
    const next = applySm2({ ...baseState, repetition: 1 }, 4);
    expect(next.repetition).toBe(2);
    expect(next.intervalDays).toBe(6);
  });

  it("scales by ease factor on third+ successes", () => {
    const next = applySm2(
      { ...baseState, repetition: 2, intervalDays: 6, easeFactor: 2.5 },
      5,
    );
    expect(next.repetition).toBe(3);
    expect(next.intervalDays).toBeGreaterThanOrEqual(15);
  });

  it("never lets easeFactor drop below 1.3", () => {
    let s = baseState;
    for (let i = 0; i < 20; i++) s = applySm2(s, 0);
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("raises easeFactor on perfect recall", () => {
    const next = applySm2(baseState, 5);
    expect(next.easeFactor).toBeGreaterThan(2.5);
  });
});

describe("isDue", () => {
  it("treats past dueAt as due", () => {
    expect(isDue({ dueAt: new Date(Date.now() - 1000) })).toBe(true);
  });
  it("treats future dueAt as not due", () => {
    expect(isDue({ dueAt: new Date(Date.now() + 60_000) })).toBe(false);
  });
  it("accepts ISO strings", () => {
    expect(isDue({ dueAt: new Date(Date.now() - 1000).toISOString() })).toBe(true);
  });
});
