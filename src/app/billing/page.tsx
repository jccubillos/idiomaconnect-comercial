import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingClient, type SubInfo } from "@/components/billing/BillingClient";

export const dynamic = "force-dynamic";

/**
 * Página de pagos:
 *  · Sin suscripción → elegir plan (mensual/anual) y pasar al checkout.
 *  · Con suscripción → estado + portal del cliente (tarjeta, boletas, cancelar).
 */
export default async function BillingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/billing");

  const { data: family } = await supabase
    .from("families")
    .select("plan, subscription_status, payment_subscription_id")
    .eq("owner_user_id", user.id)
    .single();

  const FAMILY_PAID = ["family_monthly", "family_yearly", "family_plus", "family_lifetime"] as const;
  const sub: SubInfo | null =
    family && (FAMILY_PAID as readonly string[]).includes(family.plan)
      ? {
          plan: family.plan as SubInfo["plan"],
          status: family.plan === "family_lifetime" ? "lifetime" : family.subscription_status,
          hasPortal: !!family.payment_subscription_id && family.plan !== "family_lifetime",
        }
      : null;

  return <BillingClient sub={sub} />;
}
