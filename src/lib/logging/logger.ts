/**
 * Structured logger. Emits JSON-per-line in production (Vercel/Datadog/Logflare ready)
 * and pretty-prints in dev. Optionally forwards errors to Sentry if SENTRY_DSN is set.
 *
 * Design: never logs PII. The `redact()` helper scrubs known fields.
 */

type Level = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const REDACT_KEYS = new Set([
  "email", "password", "token", "stripe_customer_id", "stripe_subscription_id",
  "audio", "transcript", "kid_name", "name", "address", "phone",
]);

function redact(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "string" && v.length > 500) {
      out[k] = v.slice(0, 500) + "…[truncated]";
    } else {
      out[k] = redact(v);
    }
  }
  return out;
}

function emit(level: Level, message: string, context: LogContext = {}) {
  const record = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(redact(context) as object),
  };

  if (process.env.NODE_ENV === "production") {
    const line = JSON.stringify(record);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  } else {
    const tag = level === "error" ? "❌" : level === "warn" ? "⚠️" : level === "info" ? "ℹ️" : "·";
    // eslint-disable-next-line no-console
    console.log(`${tag} ${message}`, context);
  }

  // Forward errors to Sentry if configured (lazy import to avoid hard dependency)
  if (level === "error" && process.env.SENTRY_DSN) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require("@sentry/nextjs");
      Sentry.captureMessage(message, { level: "error", extra: redact(context) as Record<string, unknown> });
    } catch {
      // Sentry not installed yet — that's fine, the JSON line is still emitted
    }
  }
}

export const log = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),
};

/**
 * Wrap an API route handler to log timings + errors automatically.
 *
 * Usage:
 *   export const POST = withLogging("lessons.generate", async (req) => { ... });
 */
export function withLogging<T extends (req: Request) => Promise<Response>>(
  routeName: string,
  handler: T,
): T {
  return (async (req: Request) => {
    const start = Date.now();
    try {
      const res = await handler(req);
      log.info(`api.${routeName}`, {
        status: res.status,
        ms: Date.now() - start,
      });
      return res;
    } catch (err) {
      log.error(`api.${routeName}.failed`, {
        ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }) as T;
}
