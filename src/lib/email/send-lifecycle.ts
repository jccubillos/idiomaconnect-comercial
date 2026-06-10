import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getResend, FROM_EMAIL } from "./resend";

/**
 * Envío de correos del ciclo de vida con registro en email_log.
 *
 * - El email_log es la fuente de verdad de las cadencias (cuántos van, cuándo
 *   fue el último). SOLO se registra si el envío fue real.
 * - Modo DORMIDO: si RESEND_API_KEY falta o es dummy, no envía ni registra
 *   (las secuencias parten de cero cuando el correo real esté configurado).
 */

export function emailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY ?? "";
  return key.length > 10 && !key.startsWith("dummy");
}

export async function sendLifecycleEmail(
  svc: SupabaseClient,
  args: {
    familyId: string | null;
    email: string;
    kind: string;
    subject: string;
    html: string;
    meta?: Record<string, unknown>;
  },
): Promise<"sent" | "skipped" | "error"> {
  if (!emailConfigured()) return "skipped";

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: args.email,
      subject: args.subject,
      html: args.html,
    });
    if (error) {
      console.error("[lifecycle email] send failed", args.kind, error);
      return "error";
    }
    await svc.from("email_log").insert({
      family_id: args.familyId,
      email: args.email,
      kind: args.kind,
      meta: (args.meta ?? null) as never,
    });
    return "sent";
  } catch (err) {
    console.error("[lifecycle email] exception", args.kind, err);
    return "error";
  }
}

/**
 * Token de baja (unsubscribe) firmado con HMAC — sin tablas extra.
 * Link: /api/unsubscribe?f=<familyId>&t=<token>
 */
export function unsubscribeToken(familyId: string): string {
  const secret = process.env.CRON_SECRET ?? "dev-secret";
  return createHmac("sha256", secret).update(`unsub:${familyId}`).digest("hex").slice(0, 32);
}

export function unsubscribeUrl(appUrl: string, familyId: string): string {
  return `${appUrl}/api/unsubscribe?f=${familyId}&t=${unsubscribeToken(familyId)}`;
}
