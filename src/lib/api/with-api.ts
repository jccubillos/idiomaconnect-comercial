/**
 * `withApi` — wrapper for API route handlers that centralizes:
 *   - JSON body parsing + Zod validation
 *   - Auth check (rejects if no Supabase user)
 *   - Structured logging with timing
 *   - Optional rate limiting
 *   - Error normalization (never leak stack traces)
 *
 * Usage:
 *   export const POST = withApi({
 *     name: "lessons.generate",
 *     schema: BodySchema,
 *     rateLimit: "llmGenerate",
 *     handler: async ({ body, user, supabase }) => { ... },
 *   });
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { enforceLimit, type LimitKind } from "@/lib/rate-limit";
import { log } from "@/lib/logging/logger";

type Sb = SupabaseClient<Database>;

interface HandlerArgs<Body> {
  body: Body;
  user: User;
  supabase: Sb;
  req: Request;
}

interface WithApiOpts<Schema extends z.ZodTypeAny> {
  name: string;
  schema?: Schema;
  /** If false, skip auth and pass user=null (still works server-side). */
  requireAuth?: boolean;
  /** Optional rate limit key. */
  rateLimit?: LimitKind;
  /** Handler. Receives validated body + auth context. */
  handler: (
    args: HandlerArgs<Schema extends z.ZodTypeAny ? z.infer<Schema> : unknown>,
  ) => Promise<NextResponse | Response>;
}

export function withApi<Schema extends z.ZodTypeAny>(opts: WithApiOpts<Schema>) {
  return async (req: Request): Promise<Response> => {
    const start = Date.now();
    const requireAuth = opts.requireAuth !== false;

    try {
      // ── Auth ───────────────────────────────────────
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (requireAuth && !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // ── Rate limit ─────────────────────────────────
      if (opts.rateLimit && user) {
        const rl = enforceLimit(user.id, opts.rateLimit);
        if (!rl.ok) {
          return NextResponse.json(
            { error: `Cuota alcanzada. Vuelve en ${Math.ceil(rl.resetIn / 60)} min.`, code: "rate_limit" },
            { status: 429, headers: { "Retry-After": String(rl.resetIn) } },
          );
        }
      }

      // ── Body parse ─────────────────────────────────
      let body: unknown = undefined;
      if (opts.schema) {
        try {
          const raw = await req.json();
          const parsed = opts.schema.safeParse(raw);
          if (!parsed.success) {
            return NextResponse.json(
              { error: "Invalid body", details: parsed.error.errors.slice(0, 3) },
              { status: 400 },
            );
          }
          body = parsed.data;
        } catch {
          return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
      }

      // ── Run handler ────────────────────────────────
      const res = await opts.handler({
        body: body as Schema extends z.ZodTypeAny ? z.infer<Schema> : never,
        user: user!,
        supabase,
        req,
      });

      log.info(`api.${opts.name}`, { status: res.status, ms: Date.now() - start });
      return res;
    } catch (err) {
      log.error(`api.${opts.name}.crashed`, {
        ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
