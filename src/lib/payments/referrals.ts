import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "@/lib/logging/logger";

/**
 * PREMIO DEL PROGRAMA DE REFERIDOS — "regala un mes, gana un mes".
 *
 * Se llama cuando una familia REFERIDA contrata un plan pagado (vía Hotmart o
 * Lemon Squeezy). Otorga 30 días gratis a su REFERENTE, UNA SOLA VEZ por
 * familia referida (idempotente gracias a la unique de referral_rewards).
 *
 * Cómo se entrega el premio según el estado del referente:
 *   · trial vigente            → +30 días a trial_ends_at (atrasa su paywall).
 *   · plan temporal (Hotmart)  → +30 días a plan_expires_at.
 *   · suscripción recurrente / vitalicio → no se puede empujar un mes al
 *     proveedor todavía: se registra como 'pending_credit' para honrarlo
 *     (cupón/crédito) cuando los pagos estén activos.
 *
 * Degrada con gracia: si la migración 0017 no está aplicada o no hay service
 * key, no hace nada (no rompe la contratación del referido).
 */

const REWARD_DAYS = 30;
const DAY_MS = 86_400_000;

interface ReferrerState {
  plan: string;
  trial_ends_at: string | null;
  plan_expires_at: string | null;
}

export interface RewardPlan {
  /** 'extended' = se sumaron días; 'pending_credit' = crédito por aplicar luego. */
  method: "extended" | "pending_credit";
  /** Campos a actualizar en families (vacío si pending_credit). */
  update: Record<string, string>;
}

/**
 * Decide CÓMO se entrega el premio al referente, sin tocar la base de datos
 * (función pura → testeable). Reglas:
 *   · trial vigente            → +30 días a trial_ends_at.
 *   · plan temporal (Hotmart)  → +30 días a plan_expires_at.
 *   · recurrente / vitalicio   → pending_credit (sin tocar fechas).
 * Cada extensión parte del MÁXIMO entre hoy y la fecha vigente (nunca acorta).
 */
export function planReferralReward(referrer: ReferrerState, now: number): RewardPlan {
  if (referrer.plan === "trial" && referrer.trial_ends_at) {
    const base = Math.max(now, new Date(referrer.trial_ends_at).getTime());
    return { method: "extended", update: { trial_ends_at: new Date(base + REWARD_DAYS * DAY_MS).toISOString() } };
  }
  if (referrer.plan_expires_at) {
    const base = Math.max(now, new Date(referrer.plan_expires_at).getTime());
    return { method: "extended", update: { plan_expires_at: new Date(base + REWARD_DAYS * DAY_MS).toISOString() } };
  }
  return { method: "pending_credit", update: {} };
}

export async function rewardReferrerOnConversion(
  svc: SupabaseClient,
  referredFamilyId: string,
): Promise<void> {
  try {
    // 1. ¿La familia que contrató fue referida por alguien?
    const { data: referred } = await svc
      .from("families")
      .select("id, referred_by")
      .eq("id", referredFamilyId)
      .single();
    const code = referred?.referred_by?.trim();
    if (!code) return;

    // 2. Encontrar al REFERENTE por su código.
    const { data: referrer } = await svc
      .from("families")
      .select("id, plan, trial_ends_at, plan_expires_at")
      .eq("referral_code", code)
      .single();
    if (!referrer) return;
    if (referrer.id === referredFamilyId) return; // anti auto-referido

    // 3. Decidir CÓMO se entrega el premio según el estado del referente.
    const { method, update } = planReferralReward(referrer, Date.now());

    // 4. Registrar el premio (IDEMPOTENTE). Si choca la unique, ya estaba
    //    premiado → no volver a extender.
    const { error: insErr } = await svc.from("referral_rewards").insert({
      referrer_family_id: referrer.id,
      referred_family_id: referredFamilyId,
      referral_code: code,
      method,
      reward_days: REWARD_DAYS,
    });
    if (insErr) return; // duplicado (ya premiado) o tabla sin migrar.

    // 5. Aplicar la extensión SOLO si el premio fue nuevo.
    if (Object.keys(update).length > 0) {
      await svc.from("families").update(update).eq("id", referrer.id);
    }

    log.info("referral.rewarded", {
      referrer: referrer.id,
      referred: referredFamilyId,
      method,
    });
  } catch {
    /* migración 0017 pendiente o sin service key → no-op con gracia */
  }
}
