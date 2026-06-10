import { describe, it, expect } from "vitest";
import { SEQUENCES, emailDue, purgeDue, retentionDeadline, qualifiesForOffer } from "./cadence";

const D = 86_400_000;
const t0 = new Date("2026-06-01T12:00:00Z");
const days = (n: number) => new Date(t0.getTime() + n * D);

describe("emailDue — secuencia post-trial (2d ×15, luego 7d ×8)", () => {
  const spec = SEQUENCES.post_trial;

  it("primer correo sale apenas vence el trial", () => {
    expect(emailDue(spec, 0, null, t0, t0)).toBe(true);
  });

  it("no envía antes del ancla", () => {
    expect(emailDue(spec, 0, null, t0, days(-1))).toBe(false);
  });

  it("respeta la cadencia de 2 días en fase 1", () => {
    expect(emailDue(spec, 1, t0, t0, days(1))).toBe(false); // ayer enviado
    expect(emailDue(spec, 1, t0, t0, days(2))).toBe(true);  // 2 días → toca
  });

  it("tras el correo 15 pasa a cadencia de 7 días", () => {
    const last = days(30);
    expect(emailDue(spec, 15, last, t0, days(32))).toBe(false); // solo 2 días
    expect(emailDue(spec, 15, last, t0, days(37))).toBe(true);  // 7 días → toca
  });

  it("se detiene en 23 correos (15+8)", () => {
    expect(emailDue(spec, 23, days(90), t0, days(120))).toBe(false);
  });
});

describe("emailDue — dunning", () => {
  it("familiar: corta en 15", () => {
    expect(emailDue(SEQUENCES.dunning_family, 14, days(27), t0, days(29))).toBe(true);
    expect(emailDue(SEQUENCES.dunning_family, 15, days(29), t0, days(31))).toBe(false);
  });

  it("colegio: corta en 30", () => {
    expect(emailDue(SEQUENCES.dunning_school, 29, days(57), t0, days(59))).toBe(true);
    expect(emailDue(SEQUENCES.dunning_school, 30, days(59), t0, days(61))).toBe(false);
  });
});

describe("purgeDue / retentionDeadline", () => {
  it("trial y familia purgan a los 30 días; colegio a los 180", () => {
    expect(purgeDue("trial", t0, days(29))).toBe(false);
    expect(purgeDue("trial", t0, days(30))).toBe(true);
    expect(purgeDue("family", t0, days(30))).toBe(true);
    expect(purgeDue("school", t0, days(179))).toBe(false);
    expect(purgeDue("school", t0, days(180))).toBe(true);
  });

  it("la fecha límite coincide con la retención", () => {
    expect(retentionDeadline("trial", t0).getTime()).toBe(days(30).getTime());
    expect(retentionDeadline("school", t0).getTime()).toBe(days(180).getTime());
  });
});

describe("qualifiesForOffer — oferta 15%", () => {
  it("califica con ≥200 XP o nivel sobre A1", () => {
    expect(qualifiesForOffer([{ total_xp: 200, cefr_level: "A1" }])).toBe(true);
    expect(qualifiesForOffer([{ total_xp: 50, cefr_level: "A2" }])).toBe(true);
    expect(qualifiesForOffer([{ total_xp: 199, cefr_level: "A1" }])).toBe(false);
    expect(qualifiesForOffer([])).toBe(false);
  });
});
