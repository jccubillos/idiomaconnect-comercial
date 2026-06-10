/**
 * Lemon Squeezy client — Merchant of Record for global subscription billing.
 *
 * Why Lemon Squeezy: Stripe doesn't accept Chilean merchant accounts.
 * LS handles VAT/IVA in 100+ countries, pays out monthly to our Chilean
 * bank account, exposes a Stripe-like REST API.
 *
 * Docs: https://docs.lemonsqueezy.com/api
 */

import { lemonSqueezySetup, createCheckout, createDiscount } from "@lemonsqueezy/lemonsqueezy.js";

let initialized = false;

function init() {
  if (initialized) return;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY not configured");
  lemonSqueezySetup({
    apiKey,
    onError: (err) => console.error("[lemonsqueezy]", err),
  });
  initialized = true;
}

export const LS_CONFIG = {
  storeId: process.env.LEMONSQUEEZY_STORE_ID!,
  variantMonthly: process.env.NEXT_PUBLIC_LS_VARIANT_MONTHLY!,
  variantYearly: process.env.NEXT_PUBLIC_LS_VARIANT_YEARLY!,
} as const;

export const VARIANT_TO_PLAN: Record<string, "family_monthly" | "family_yearly"> = {
  [LS_CONFIG.variantMonthly]: "family_monthly",
  [LS_CONFIG.variantYearly]: "family_yearly",
};

/**
 * Create a Lemon Squeezy hosted checkout session and return its URL.
 * The user is redirected there to complete payment.
 *
 * @param plan       "monthly" | "yearly"
 * @param email      Pre-fill email for the LS checkout form
 * @param familyId   Our internal family ID — gets stored in custom_data so the
 *                   webhook can identify which family to upgrade.
 * @param successUrl Where to send the user after successful checkout.
 */
export async function createSubscriptionCheckout(args: {
  plan: "monthly" | "yearly";
  email: string;
  familyId: string;
  successUrl: string;
  /** Código de descuento pre-cargado (ej. oferta 15% post-trial). */
  discountCode?: string;
}): Promise<{ url: string } | { error: string }> {
  init();

  const variantId = args.plan === "monthly" ? LS_CONFIG.variantMonthly : LS_CONFIG.variantYearly;

  try {
    const result = await createCheckout(LS_CONFIG.storeId, variantId, {
      checkoutData: {
        email: args.email,
        discountCode: args.discountCode,
        custom: {
          family_id: args.familyId,
          plan: args.plan,
        },
      },
      productOptions: {
        redirectUrl: args.successUrl,
        receiptButtonText: "Volver a IdiomaConnect",
        receiptThankYouNote: "¡Listo! Tu suscripción está activa.",
      },
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true,
        // Muestra el campo "¿Tienes un código de descuento?" en el checkout.
        discount: true,
      },
    });

    const url = result.data?.data?.attributes?.url;
    if (!url) return { error: "Lemon Squeezy did not return a checkout URL" };
    return { url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

/**
 * Crea un código de descuento PERSONAL en Lemon Squeezy (oferta 15% post-trial):
 * 15% de descuento, 1 solo uso, válido por 30 días. Devuelve el código a incluir
 * en el link personalizado (/billing?promo=CODE).
 */
export async function createPersonalDiscount(args: {
  code: string;        // ej. "TRIAL15-AB12CD"
  name: string;        // referencia interna, ej. "Oferta post-trial familia X"
  percent?: number;    // default 15
  validDays?: number;  // default 30
}): Promise<{ code: string } | { error: string }> {
  init();
  try {
    const expiresAt = new Date(Date.now() + (args.validDays ?? 30) * 86_400_000).toISOString();
    const result = await createDiscount({
      storeId: LS_CONFIG.storeId,
      name: args.name,
      code: args.code,
      amount: args.percent ?? 15,
      amountType: "percent",
      isLimitedRedemptions: true,
      maxRedemptions: 1,
      expiresAt,
    });
    const code = result.data?.data?.attributes?.code;
    if (!code) return { error: "Lemon Squeezy did not return a discount code" };
    return { code };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
