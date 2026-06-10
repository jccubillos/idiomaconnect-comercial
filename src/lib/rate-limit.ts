/**
 * Simple in-memory rate limiter. Suitable for single-region MVP.
 *
 * For multi-region / serverless cold starts: replace `bucket` with Upstash Redis
 * (one env var swap). The interface stays identical.
 */

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

export function enforceLimit(userId: string, kind: LimitKind): RateLimitResult {
  return checkRateLimit(`${userId}:${kind}`, LIMITS[kind]);
}
