import { describe, it, expect } from "vitest";
import { planReferralReward } from "./referrals";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 5, 13); // referencia fija
const at = (ms: number) => new Date(ms).toISOString();

describe("planReferralReward — cómo se entrega el mes al referente", () => {
  it("referente en trial vigente → +30 días sobre el fin actual del trial", () => {
    const trialEnd = NOW + 3 * DAY;
    const r = planReferralReward(
      { plan: "trial", trial_ends_at: at(trialEnd), plan_expires_at: null },
      NOW,
    );
    expect(r.method).toBe("extended");
    expect(r.update.trial_ends_at).toBe(at(trialEnd + 30 * DAY));
  });

  it("referente en trial ya vencido → +30 días desde HOY (no acorta)", () => {
    const r = planReferralReward(
      { plan: "trial", trial_ends_at: at(NOW - 10 * DAY), plan_expires_at: null },
      NOW,
    );
    expect(r.method).toBe("extended");
    expect(r.update.trial_ends_at).toBe(at(NOW + 30 * DAY));
  });

  it("referente con plan temporal Hotmart → +30 días sobre plan_expires_at", () => {
    const expiry = NOW + 100 * DAY;
    const r = planReferralReward(
      { plan: "family_plus", trial_ends_at: null, plan_expires_at: at(expiry) },
      NOW,
    );
    expect(r.method).toBe("extended");
    expect(r.update.plan_expires_at).toBe(at(expiry + 30 * DAY));
    expect(r.update.trial_ends_at).toBeUndefined();
  });

  it("referente con suscripción recurrente (sin vencimiento) → pending_credit", () => {
    for (const plan of ["family_monthly", "family_yearly", "family_plus"]) {
      const r = planReferralReward({ plan, trial_ends_at: null, plan_expires_at: null }, NOW);
      expect(r.method).toBe("pending_credit");
      expect(r.update).toEqual({});
    }
  });

  it("referente vitalicio → pending_credit (no se toca su acceso perpetuo)", () => {
    const r = planReferralReward(
      { plan: "family_lifetime", trial_ends_at: null, plan_expires_at: null },
      NOW,
    );
    expect(r.method).toBe("pending_credit");
    expect(r.update).toEqual({});
  });

  it("nunca acorta el plan temporal aunque hoy sea posterior al vencimiento", () => {
    const r = planReferralReward(
      { plan: "family_plus", trial_ends_at: null, plan_expires_at: at(NOW - 5 * DAY) },
      NOW,
    );
    expect(r.update.plan_expires_at).toBe(at(NOW + 30 * DAY));
  });
});
