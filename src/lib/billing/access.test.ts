import { describe, it, expect } from "vitest";
import { familyAccess } from "./access";

const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

describe("familyAccess — gate de plan/trial", () => {
  it("planes pagados siempre activos", () => {
    for (const plan of ["family_monthly", "family_yearly", "school"]) {
      const a = familyAccess({ plan, trial_ends_at: inDays(-100) });
      expect(a.active).toBe(true);
      expect(a.expired).toBe(false);
    }
  });

  it("trial vigente → activo con días restantes", () => {
    const a = familyAccess({ plan: "trial", trial_ends_at: inDays(3) });
    expect(a.active).toBe(true);
    expect(a.isTrial).toBe(true);
    expect(a.daysLeft).toBe(3);
  });

  it("trial vencido → bloqueado (el bug del trial eterno)", () => {
    const a = familyAccess({ plan: "trial", trial_ends_at: inDays(-1) });
    expect(a.active).toBe(false);
    expect(a.expired).toBe(true);
    expect(a.daysLeft).toBe(0);
  });

  it("último día del trial cuenta como 1 día restante", () => {
    const a = familyAccess({ plan: "trial", trial_ends_at: inDays(0.5) });
    expect(a.active).toBe(true);
    expect(a.daysLeft).toBe(1);
  });

  it("plan expired → bloqueado", () => {
    const a = familyAccess({ plan: "expired", trial_ends_at: null });
    expect(a.active).toBe(false);
    expect(a.expired).toBe(true);
  });
});
