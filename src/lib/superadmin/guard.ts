import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAppAdmin, verifyAdminSession, ADMIN_COOKIE } from "./auth";

/**
 * Guard de las APIs del dashboard admin. Exige LAS TRES capas:
 *  1. Sesión Supabase válida.
 *  2. Membresía en app_admins.
 *  3. Cookie TOTP vigente (12 h).
 *
 * Devuelve 404 (no 403) para no revelar que el endpoint existe.
 */
export async function requireSuperAdmin(): Promise<
  | { ok: true; userId: string; svc: SupabaseClient }
  | { ok: false; status: number; error: string }
> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "No autorizado" };

  const svc = createServiceClient();
  const admin = await getAppAdmin(svc, user.id);
  if (!admin) return { ok: false, status: 404, error: "Not found" };

  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  if (!admin.totp_verified || !verifyAdminSession(cookie, user.id)) {
    return { ok: false, status: 403, error: "Sesión admin expirada. Ingresa tu código TOTP." };
  }

  return { ok: true, userId: user.id, svc };
}
