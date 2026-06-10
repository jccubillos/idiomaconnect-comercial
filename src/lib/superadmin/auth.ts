import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Autenticación del DASHBOARD DE ADMINISTRACIÓN (/admin) — 3 capas:
 *  1. Sesión normal de Supabase (login con correo y contraseña).
 *  2. Membresía en app_admins (tabla solo-servidor; nadie más sabe que existe).
 *  3. TOTP (Google Authenticator) → cookie firmada HMAC de corta vida.
 *
 * El acceso es por URL directa discreta (sin links públicos). Un usuario no-admin
 * que visite /admin recibe un 404, como si la página no existiera.
 */

export const ADMIN_COOKIE = "ic_admin";
export const ADMIN_SESSION_HOURS = 12;

function secretKey(): string {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.CRON_SECRET ?? "dev-admin-secret";
}

/** Crea el valor de la cookie de sesión admin: `userId.exp.hmac`. */
export function signAdminSession(userId: string, ttlHours = ADMIN_SESSION_HOURS): string {
  const exp = Date.now() + ttlHours * 3_600_000;
  const payload = `${userId}.${exp}`;
  const sig = createHmac("sha256", secretKey()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** Verifica la cookie: pertenece a ESTE usuario, no expiró y la firma es válida. */
export function verifyAdminSession(value: string | undefined | null, userId: string): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [uid, expStr, sig] = parts;
  if (uid !== userId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac("sha256", secretKey()).update(`${uid}.${expStr}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export interface AdminRow {
  user_id: string;
  totp_secret: string | null;
  totp_verified: boolean;
}

/** Fila de app_admins del usuario (null = NO es administrador de la plataforma). */
export async function getAppAdmin(svc: SupabaseClient, userId: string): Promise<AdminRow | null> {
  try {
    const { data } = await svc
      .from("app_admins")
      .select("user_id, totp_secret, totp_verified")
      .eq("user_id", userId)
      .single();
    return (data as AdminRow) ?? null;
  } catch {
    return null; // tabla aún no migrada → nadie es admin (falla cerrado)
  }
}

/** Auditoría: registra cada acción del administrador. */
export async function audit(
  svc: SupabaseClient,
  userId: string,
  action: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await svc.from("admin_audit").insert({ user_id: userId, action, detail: (detail ?? null) as never });
  } catch {
    /* la auditoría nunca debe romper la acción principal */
  }
}
