import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCustomerPortalUrl } from "@/lib/payments/lemonsqueezy";
import { log } from "@/lib/logging/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Redirige al PORTAL DEL CLIENTE de Lemon Squeezy: actualizar tarjeta,
 * descargar boletas o cancelar la suscripción (acceso hasta fin del período).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/billing", url.origin));

  const { data: family } = await supabase
    .from("families")
    .select("payment_subscription_id")
    .eq("owner_user_id", user.id)
    .single();

  if (!family?.payment_subscription_id) {
    return NextResponse.redirect(new URL("/billing?portal=none", url.origin));
  }

  const portal = await getCustomerPortalUrl(family.payment_subscription_id);
  if ("error" in portal) {
    log.warn("payments.portal.failed", { error: portal.error });
    return NextResponse.redirect(new URL("/billing?portal=unavailable", url.origin));
  }

  return NextResponse.redirect(portal.url);
}
