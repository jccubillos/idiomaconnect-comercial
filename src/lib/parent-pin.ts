import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyParentPassword } from "./parent-auth";

/**
 * Clave del dashboard de padres, AHORA POR FAMILIA (no global).
 *
 * Modelo de dos claves:
 *  1. Clave de ACCESO (login de Supabase): la usan todos en el dispositivo
 *     compartido para entrar a la app y elegir un perfil de niño.
 *  2. Clave del DASHBOARD de padres (este PIN): protege el panel con datos
 *     sensibles (progreso detallado, facturación, settings). Debe ser DISTINTA
 *     de la de acceso, para que un niño no pueda abrir el panel de padres.
 *
 * El PIN se guarda HASHEADO (scrypt) en families.parent_pin_hash. Es una barrera
 * a nivel de dispositivo; el control real de datos lo da RLS + la sesión.
 */

/** Genera un hash scrypt con salt aleatorio. Formato: scrypt$<saltHex>$<hashHex>. */
export function hashParentPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Verifica un PIN contra un hash almacenado (tiempo constante). */
export function verifyParentPinHash(pin: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const actual = scryptSync(pin, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Verifica el PIN del dashboard para la familia del usuario.
 * - Si la familia tiene un PIN propio configurado → lo valida contra ese.
 * - Si no (o la columna aún no existe) → cae al PIN global del entorno
 *   (compatibilidad hacia atrás mientras el padre no configura el suyo).
 */
export async function verifyFamilyParentPin(
  supabase: SupabaseClient,
  userId: string,
  input: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("families")
      .select("parent_pin_hash")
      .eq("owner_user_id", userId)
      .single();
    if (!error && data?.parent_pin_hash) {
      return verifyParentPinHash(input, data.parent_pin_hash);
    }
  } catch {
    /* La columna parent_pin_hash aún no existe → usar fallback global. */
  }
  return verifyParentPassword(input);
}
