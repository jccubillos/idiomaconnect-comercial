import { timingSafeEqual } from "node:crypto";

/**
 * Verifica la clave del dashboard de padres.
 *
 * Notas de seguridad:
 *  - Comparación en tiempo constante (evita ataques de timing).
 *  - Falla CERRADO en producción: si `PARENT_DASHBOARD_PASSWORD` no está
 *    configurada, nadie entra (en vez de caer a una clave por defecto conocida).
 *  - En desarrollo se permite el default `padres1234` por conveniencia.
 *
 * Esta clave es una barrera a nivel de dispositivo (que el niño no abra el panel),
 * NO el control de acceso a los datos: eso lo garantiza RLS + la sesión del padre.
 */
export function verifyParentPassword(input: string): boolean {
  const configured = process.env.PARENT_DASHBOARD_PASSWORD;
  const isProd = process.env.NODE_ENV === "production";

  // Fail-closed: en producción exigimos clave configurada.
  if (!configured && isProd) return false;
  const expected = configured ?? "padres1234";

  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
