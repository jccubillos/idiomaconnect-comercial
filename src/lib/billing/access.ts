import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ACCESO POR PLAN — la fuente única de verdad de "¿esta familia puede usar la app?".
 *
 * Reglas:
 *  - family_monthly / family_yearly / school → acceso activo.
 *  - trial → activo SOLO hasta trial_ends_at (7 días desde el registro).
 *  - expired u otro → sin acceso (paywall).
 *
 * Los datos NO se borran al expirar: se conservan 30 días (familias) según la
 * política comercial, para que al suscribirse retomen donde quedaron.
 */

export interface FamilyAccess {
  active: boolean;
  isTrial: boolean;
  /** true cuando el trial venció (o el plan está 'expired'). */
  expired: boolean;
  /** Días restantes del trial (null si no es trial). */
  daysLeft: number | null;
}

/** Planes pagados con acceso completo a la app. */
const PAID_PLANS = new Set(["family_monthly", "family_yearly", "family_plus", "family_lifetime", "school"]);

interface FamilyLike {
  plan: string;
  trial_ends_at: string | null;
  /** Vencimiento de planes pagados temporales (paquetes Hotmart). null = sin vencimiento. */
  plan_expires_at?: string | null;
}

export function familyAccess(family: FamilyLike): FamilyAccess {
  if (PAID_PLANS.has(family.plan)) {
    // Planes pagados TEMPORALES (paquetes Hotmart): vencen en plan_expires_at.
    if (family.plan_expires_at && new Date(family.plan_expires_at).getTime() < Date.now()) {
      return { active: false, isTrial: false, expired: true, daysLeft: 0 };
    }
    return { active: true, isTrial: false, expired: false, daysLeft: null };
  }
  if (family.plan === "trial" && family.trial_ends_at) {
    const msLeft = new Date(family.trial_ends_at).getTime() - Date.now();
    if (msLeft > 0) {
      return { active: true, isTrial: true, expired: false, daysLeft: Math.ceil(msLeft / 86_400_000) };
    }
  }
  return { active: false, isTrial: family.plan === "trial", expired: true, daysLeft: 0 };
}

/**
 * ¿Tiene acceso a las herramientas PLUS? (Arena Global, Reto a un amigo, Duelo Familiar)
 *  · family_plus y family_lifetime → sí.
 *  · school → sí (los colegios ya tienen su propio set competitivo).
 *  · trial VIGENTE → sí (el gancho: prueban lo mejor y luego eligen plan).
 *  · family_monthly / family_yearly → no (incentivo de upgrade).
 */
export function hasPlusAccess(family: FamilyLike): boolean {
  // Si el plan venció (paquete Hotmart temporal), no hay acceso Plus.
  if (family.plan_expires_at && new Date(family.plan_expires_at).getTime() < Date.now()) {
    return false;
  }
  if (family.plan === "family_plus" || family.plan === "family_lifetime" || family.plan === "school") {
    return true;
  }
  if (family.plan === "trial" && family.trial_ends_at) {
    return new Date(family.trial_ends_at).getTime() > Date.now();
  }
  return false;
}

type Deny = { ok: false; status: number; error: string; code: string };
type AllowKid = { ok: true; kid: { id: string; family_id: string } };

const PAYWALL: Deny = {
  ok: false,
  status: 402,
  error: "Tu período de prueba terminó. Suscríbete para seguir aprendiendo.",
  code: "paywall",
};

/**
 * Gate para APIs de contenido que reciben kidId: verifica que el kid exista
 * (RLS limita a la propia familia o staff del colegio) y que su FAMILIA tenga
 * acceso activo.
 *
 * Nota colegios: si el kid es visible pero la fila de families no lo es para
 * este usuario (profesor con RLS), el acceso viene dado por las políticas de
 * staff → se permite (el colegio paga plan 'school').
 */
export async function requireKidAccess(
  supabase: SupabaseClient,
  kidId: string,
): Promise<AllowKid | Deny> {
  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, family_id")
    .eq("id", kidId)
    .single();
  if (!kid) return { ok: false, status: 404, error: "Kid not found", code: "not_found" };

  const { data: family } = await supabase
    .from("families")
    .select("plan, trial_ends_at")
    .eq("id", kid.family_id)
    .single();

  // Fila de familia no visible → acceso vía staff de colegio (plan school).
  if (!family) return { ok: true, kid };

  if (!familyAccess(family).active) return PAYWALL;
  return { ok: true, kid };
}
