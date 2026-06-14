import type { SupabaseClient } from "@supabase/supabase-js";
import { rewardReferrerOnConversion } from "@/lib/payments/referrals";

/**
 * Hotmart — fulfillment del canal de afiliados.
 *
 * Hotmart autentica sus webhooks con un token compartido ("hottok") que se
 * configura al crear el webhook y llega en el body/headers de cada evento.
 * Mapeamos cada PRODUCTO (por su id de Hotmart) al acceso que otorga en la app.
 */

export interface HotmartProductMap {
  plan: "family_yearly" | "family_plus" | "family_lifetime";
  plus: boolean;
  months: number | null; // null = de por vida
  /** Cupo de niños del paquete (Starter 1, Pro Family 6). */
  maxKids: number;
  label: string;
}

/**
 * Mapa producto Hotmart → acceso. Los IDs se configuran por env vars
 * (HOTMART_PRODUCT_STARTER, _PRO) cuando JC cree los productos.
 * Lista de precios oficial (junio 2026), solo canal afiliados:
 *   · English Starter    → acceso base, 6 meses, 1 niño  (US$69)
 *   · English Pro Family → acceso Plus, 12 meses, 6 niños (US$297, estrella)
 */
export function hotmartProductMap(): Record<string, HotmartProductMap> {
  const map: Record<string, HotmartProductMap> = {};
  const starter = process.env.HOTMART_PRODUCT_STARTER;
  const pro = process.env.HOTMART_PRODUCT_PRO;
  if (starter) map[starter] = { plan: "family_yearly", plus: false, months: 6, maxKids: 1, label: "English Starter" };
  if (pro) map[pro] = { plan: "family_plus", plus: true, months: 12, maxKids: 6, label: "English Pro Family" };
  return map;
}

/** ¿El token recibido coincide con nuestro hottok? (auth del webhook) */
export function verifyHottok(received: string | null | undefined): boolean {
  const expected = process.env.HOTMART_HOTTOK;
  return !!expected && expected.length > 6 && received === expected;
}

/** Fecha de vencimiento a partir de los meses (null = de por vida). */
export function expiryFromMonths(months: number | null): string | null {
  if (months == null) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

/**
 * Aplica una compra a la familia de un correo. Si la cuenta existe, activa el
 * plan directo; si no, deja un "entitlement" pendiente que se reclama al
 * registrarse. Idempotente por transacción.
 */
export async function grantHotmartPurchase(
  svc: SupabaseClient,
  args: { email: string; product: HotmartProductMap; transaction?: string },
): Promise<"applied" | "pending"> {
  const email = args.email.trim().toLowerCase();
  const expiresAt = expiryFromMonths(args.product.months);

  // ¿Existe una cuenta con ese correo?
  let userId: string | null = null;
  try {
    const { data } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = data?.users?.find((u) => (u.email ?? "").toLowerCase() === email)?.id ?? null;
  } catch { /* sin listUsers seguimos a pendiente */ }

  if (userId) {
    const { data: fam } = await svc.from("families").select("id").eq("owner_user_id", userId).single();
    if (fam) {
      await svc
        .from("families")
        .update({
          plan: args.product.plan,
          plan_expires_at: expiresAt,
          max_kids: args.product.maxKids,
          payment_provider: "hotmart",
          payment_failed_at: null,
          subscription_status: expiresAt ? "hotmart_active" : "lifetime",
        })
        .eq("id", fam.id);
      await svc.from("hotmart_entitlements").insert({
        email, plan: args.product.plan, plus: args.product.plus, months: args.product.months,
        max_kids: args.product.maxKids,
        transaction: args.transaction ?? null, status: "applied", applied_at: new Date().toISOString(),
      });
      // Premia al referente si esta familia llegó por un referido.
      await rewardReferrerOnConversion(svc, fam.id);
      return "applied";
    }
  }

  // Sin cuenta aún → entitlement pendiente (se aplica al registrarse con ese correo).
  await svc.from("hotmart_entitlements").insert({
    email, plan: args.product.plan, plus: args.product.plus, months: args.product.months,
    transaction: args.transaction ?? null, status: "pending",
  });
  return "pending";
}

/**
 * Reclama los entitlements pendientes de un correo recién registrado/ingresado
 * y los aplica a su familia. Se llama en el dispatcher /start.
 */
export async function claimHotmartEntitlements(
  svc: SupabaseClient,
  userId: string,
  email: string,
): Promise<boolean> {
  const lower = email.trim().toLowerCase();
  let pending: Array<{ id: string; plan: string; months: number | null; max_kids: number | null }> = [];
  try {
    const { data } = await svc
      .from("hotmart_entitlements")
      .select("id, plan, months, max_kids")
      .eq("email", lower)
      .eq("status", "pending");
    pending = data ?? [];
  } catch {
    return false; // tabla no migrada
  }
  if (pending.length === 0) return false;

  // Elegir el mejor: de por vida > más meses.
  const best = pending.sort((a, b) => {
    const av = a.months == null ? 1e9 : a.months;
    const bv = b.months == null ? 1e9 : b.months;
    return bv - av;
  })[0];

  const { data: fam } = await svc.from("families").select("id").eq("owner_user_id", userId).single();
  if (!fam) return false;

  await svc
    .from("families")
    .update({
      plan: best.plan,
      plan_expires_at: expiryFromMonths(best.months),
      max_kids: best.max_kids ?? 6,
      payment_provider: "hotmart",
      subscription_status: best.months == null ? "lifetime" : "hotmart_active",
    })
    .eq("id", fam.id);

  await svc
    .from("hotmart_entitlements")
    .update({ status: "applied", applied_at: new Date().toISOString() })
    .eq("email", lower)
    .eq("status", "pending");

  // Premia al referente si esta familia llegó por un referido.
  await rewardReferrerOnConversion(svc, fam.id);

  return true;
}
