import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hotmartProductMap, verifyHottok, grantHotmartPurchase } from "@/lib/payments/hotmart";
import { log } from "@/lib/logging/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Hotmart (canal de afiliados). Eventos relevantes:
 *  · PURCHASE_APPROVED / PURCHASE_COMPLETE → activa el acceso por el producto.
 *  · PURCHASE_REFUNDED / _CHARGEBACK / _CANCELED → expira la cuenta.
 *
 * Seguridad: token compartido "hottok" (header o body). Idempotente por id de evento.
 * Modo dormido: sin HOTMART_HOTTOK configurado, rechaza (falla cerrado) — se
 * activa cuando JC cree los productos y configure las env vars.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  let body: Record<string, unknown> = {};
  try { body = JSON.parse(raw); } catch { /* algunos envíos van como form */ }

  const hottok =
    req.headers.get("x-hotmart-hottok") ??
    (typeof body.hottok === "string" ? body.hottok : null);

  if (!verifyHottok(hottok)) {
    log.warn("hotmart.webhook.bad_token");
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const svc = createServiceClient();

  // Idempotencia.
  const eventId =
    (typeof body.id === "string" && body.id) ||
    (typeof body.event === "string" && `${body.event}:${(body.data as { purchase?: { transaction?: string } })?.purchase?.transaction ?? ""}`) ||
    null;
  if (eventId) {
    const { error: dupErr } = await svc.from("hotmart_events").insert({ id: eventId });
    if (dupErr) {
      // Clave duplicada → ya procesado.
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  const event = String(body.event ?? "").toUpperCase();
  const data = (body.data ?? {}) as {
    product?: { id?: number | string };
    buyer?: { email?: string };
    purchase?: { transaction?: string; status?: string };
  };
  const productId = String(data.product?.id ?? "");
  const email = data.buyer?.email ?? "";
  const transaction = data.purchase?.transaction;
  const map = hotmartProductMap();
  const product = map[productId];

  // ── Reembolso / contracargo / cancelación → expirar acceso ──
  if (/REFUND|CHARGEBACK|CANCEL|EXPIRED/.test(event)) {
    if (email) {
      const lower = email.trim().toLowerCase();
      // Buscar familia por correo y expirar.
      try {
        const { data: users } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const uid = users?.users?.find((u) => (u.email ?? "").toLowerCase() === lower)?.id;
        if (uid) {
          await svc.from("families").update({ plan: "expired", plan_expires_at: null }).eq("owner_user_id", uid);
        }
      } catch { /* best effort */ }
      await svc.from("hotmart_entitlements").update({ status: "refunded" }).eq("email", lower).eq("status", "pending");
    }
    log.info("hotmart.webhook.refunded", { email, transaction });
    return NextResponse.json({ received: true });
  }

  // ── Compra aprobada → otorgar acceso ──
  if (/APPROVED|COMPLETE/.test(event)) {
    if (!product) {
      log.warn("hotmart.webhook.unknown_product", { productId });
      return NextResponse.json({ received: true, note: "producto no mapeado" });
    }
    if (!email) return NextResponse.json({ received: true, note: "sin correo" });

    const result = await grantHotmartPurchase(svc, { email, product, transaction });
    log.info("hotmart.webhook.granted", { email, product: product.label, result });
    return NextResponse.json({ received: true, result });
  }

  return NextResponse.json({ received: true, ignored: event });
}
