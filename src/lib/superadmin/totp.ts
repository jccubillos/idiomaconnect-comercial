import * as OTPAuth from "otpauth";

/**
 * TOTP (Time-based One-Time Password) — el mismo estándar que usa
 * Google Authenticator, Microsoft Authenticator, Authy, etc.
 * Códigos de 6 dígitos que rotan cada 30 segundos.
 */

const ISSUER = "IdiomaConnect Admin";

/** Genera un secreto nuevo (base32) para enrolar un autenticador. */
export function newTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

/** URI otpauth:// para el código QR (lo escanea Google Authenticator). */
export function totpUri(secret: string, accountLabel: string): string {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: accountLabel,
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  }).toString();
}

/** Valida un código de 6 dígitos (ventana ±1 período para tolerar desfase de reloj). */
export function verifyTotp(secret: string, code: string): boolean {
  const clean = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  return totp.validate({ token: clean, window: 1 }) !== null;
}
