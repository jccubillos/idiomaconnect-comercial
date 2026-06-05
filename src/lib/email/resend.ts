import { Resend } from "resend";

let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured");
  cached = new Resend(key);
  return cached;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "hola@idiomaconnect.app";
