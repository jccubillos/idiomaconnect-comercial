import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyLemonSqueezySignature } from "@/lib/payments/verify-webhook";
import { VARIANT_TO_PLAN } from "@/lib/payments/lemonsqueezy";
import { rewardReferrerOnConversion } from "@/lib/payments/referrals";
import { log } from "@/lib/logging/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lemon Squeezy webhook receiver.
 *
 * LS sends events for subscription lifecycle (created, updated, cancelled,
 * payment_success, payment_failed). We map them to our `families.plan` state.
 *
 * Security: every payload is HMAC-SHA256 signed with our store's webhook
 * secret. We reject any request without a valid signature.
 *
 * Idempotency: LS may retry on failure. We use upserts where possible and
 * check current state before mutating.
 *
 * Reference: https://docs.lemonsqueezy.com/api/webhooks
 */

interface LSEvent {
  meta: {
    event_name: string;
    custom_data?: { family_id?: string; plan?: string };
  };
  data: {
    type: "subscriptions" | "subscription_invoices" | string;
    id: string;
    attributes: {
      status?: string;                  // "active", "past_due", "cancelled", "expired", etc.
      product_id?: number;
      variant_id?: number;
      customer_id?: number;
      user_email?: string;
      renews_at?: string;
      ends_at?: string;
      [key: string]: unknown;
    };
  };
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    log.error("payments.webhook.no_secret");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
    log.warn("payments.webhook.bad_signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: LSEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.meta?.event_name;
  const familyId = event.meta?.custom_data?.family_id;
  const attrs = event.data?.attributes ?? {};
  const subscriptionId = event.data?.id;

  if (!familyId) {
    // Likely a refund or non-subscription event; ack & ignore.
    log.info("payments.webhook.no_family_id", { eventName });
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();

  // Map event → plan state.
  let plan: "family_monthly" | "family_yearly" | "family_plus" | "family_lifetime" | "expired" | null = null;
  const variantId = String(attrs.variant_id ?? "");

  // VITALICIO: es un pago único (sin suscripción) → llega como order_created.
  if (eventName === "order_created" && event.meta?.custom_data?.plan === "lifetime") {
    const { error: lifeErr } = await supabase
      .from("families")
      .update({
        plan: "family_lifetime",
        payment_provider: "lemonsqueezy",
        payment_customer_id: attrs.customer_id ? String(attrs.customer_id) : undefined,
        subscription_status: "lifetime",
        payment_failed_at: null,
      })
      .eq("id", familyId);
    if (lifeErr) {
      log.error("payments.webhook.lifetime_failed", { familyId, error: lifeErr.message });
      return NextResponse.json({ error: lifeErr.message }, { status: 500 });
    }
    // Premia al referente si esta familia llegó por un referido.
    await rewardReferrerOnConversion(supabase, familyId);
    log.info("payments.webhook.lifetime_activated", { familyId });
    return NextResponse.json({ received: true });
  }

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_payment_success": {
      const mapped = VARIANT_TO_PLAN[variantId];
      const status = String(attrs.status ?? "");
      if (status === "active" || status === "on_trial") {
        plan = mapped ?? "family_monthly";
      } else if (["expired", "cancelled", "unpaid", "past_due"].includes(status)) {
        plan = "expired";
      }
      break;
    }
    case "subscription_cancelled":
    case "subscription_expired":
    case "subscription_payment_failed": {
      // Cancelled doesn't immediately expire — LS keeps active until period end.
      // We trust the `ends_at` field: if ends_at is in the past, mark expired.
      const ends = attrs.ends_at ? new Date(String(attrs.ends_at)).getTime() : null;
      if (eventName === "subscription_expired" || (ends && ends < Date.now())) {
        plan = "expired";
      }
      break;
    }
    default:
      log.info("payments.webhook.unhandled", { eventName });
      return NextResponse.json({ received: true });
  }

  const update: Record<string, unknown> = {
    payment_provider: "lemonsqueezy",
    payment_subscription_id: subscriptionId,
    payment_customer_id: attrs.customer_id ? String(attrs.customer_id) : undefined,
    subscription_status: String(attrs.status ?? ""),
  };
  if (plan) update.plan = plan;

  // Ancla de COBRANZA (dunning): al fallar un pago se fija payment_failed_at
  // (si no estaba ya fijado, para no reiniciar la cadencia de correos);
  // un pago exitoso o suscripción activa la limpia.
  const status = String(attrs.status ?? "");
  if (eventName === "subscription_payment_failed" || status === "past_due" || status === "unpaid") {
    const { data: fam } = await supabase
      .from("families")
      .select("payment_failed_at")
      .eq("id", familyId)
      .single();
    if (!fam?.payment_failed_at) update.payment_failed_at = new Date().toISOString();
  } else if (eventName === "subscription_payment_success" || status === "active") {
    update.payment_failed_at = null;
  }

  // Strip undefineds before update.
  for (const k of Object.keys(update)) if (update[k] === undefined) delete update[k];

  const { error } = await supabase
    .from("families")
    .update(update)
    .eq("id", familyId);

  if (error) {
    log.error("payments.webhook.db_update_failed", { familyId, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Premia al referente cuando el referido pasa a un plan PAGADO (idempotente).
  if (plan && plan !== "expired") {
    await rewardReferrerOnConversion(supabase, familyId);
  }

  log.info("payments.webhook.processed", { eventName, familyId, plan });
  return NextResponse.json({ received: true });
}
