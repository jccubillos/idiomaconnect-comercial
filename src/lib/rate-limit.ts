/**
 * Limitador de uso anti-abuso, en DOS capas:
 *
 *  1. DB (tabla rate_limits + RPC rate_limit_hit): cuenta GLOBAL y atómica
 *     entre todos los servidores serverless. Es la capa autoritativa.
 *  2. Memoria (este Map): fallback si la RPC aún no está migrada o falla,
 *     y para límites blandos por IP (formularios públicos).
 */

import { createServiceClient } from "@/lib/supabase/server";

type Bucket = { count: number; resetAt: number };
const bucket = new Map<string, Bucket>();

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetIn: number;
}

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowSec: number },
): RateLimitResult {
  const now = Date.now();
  const existing = bucket.get(key);
  if (!existing || existing.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + opts.windowSec * 1000 });
    return { ok: true, remaining: opts.limit - 1, resetIn: opts.windowSec };
  }
  if (existing.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      resetIn: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: opts.limit - existing.count,
    resetIn: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Pre-canned limits for the API routes. Keep generous for kids, tight for cost.
 */
export const LIMITS = {
  // Per-user, per-day cap on Groq generation calls (lesson/battle/etc.)
  llmGenerate: { limit: 60, windowSec: 24 * 60 * 60 },
  // Per-user, per-hour cap on Whisper transcription
  whisper: { limit: 80, windowSec: 60 * 60 },
  // Per-user, per-hour cap on TTS
  tts: { limit: 40, windowSec: 60 * 60 },
  // Per-user, per-minute cap on conversation turns
  conversation: { limit: 25, windowSec: 60 },
  // Intentos de código TOTP del dashboard admin (anti fuerza bruta)
  adminTotp: { limit: 8, windowSec: 15 * 60 },
} as const;

export type LimitKind = keyof typeof LIMITS;

/**
 * Límite por usuario/acción. Cuenta primero en la DB (global entre servidores);
 * si la RPC no existe o falla, cae al contador en memoria de esta instancia.
 */
export async function enforceLimit(userId: string, kind: LimitKind): Promise<RateLimitResult> {
  const opts = LIMITS[kind];
  try {
    const svc = createServiceClient();
    const { data, error } = await svc.rpc("rate_limit_hit", {
      p_key: `${userId}:${kind}`,
      p_limit: opts.limit,
      p_window_sec: opts.windowSec,
    });
    if (!error && data && typeof data === "object") {
      const d = data as { allowed: boolean; remaining: number; reset_in: number };
      if (typeof d.allowed === "boolean") {
        return { ok: d.allowed, remaining: d.remaining ?? 0, resetIn: d.reset_in ?? opts.windowSec };
      }
    }
  } catch {
    /* sin service key o migración 0013 no aplicada → fallback en memoria */
  }
  return checkRateLimit(`${userId}:${kind}`, opts);
}
