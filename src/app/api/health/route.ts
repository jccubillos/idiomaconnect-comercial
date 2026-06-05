import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Healthcheck for uptime monitors (UptimeRobot, BetterStack, etc).
 *
 * Returns 200 with version info if DB is reachable, 503 otherwise.
 * Does NOT expose credentials, env names, or internal errors.
 *
 * Hit with: GET /api/health
 */
export async function GET() {
  const checks: Record<string, "ok" | "fail" | "skip"> = {
    db: "skip",
    groq: process.env.GROQ_API_KEY ? "ok" : "fail",
    openai: process.env.OPENAI_API_KEY ? "ok" : "skip",
    stripe: process.env.STRIPE_SECRET_KEY ? "ok" : "skip",
    resend: process.env.RESEND_API_KEY ? "ok" : "skip",
  };

  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const sb = createServiceClient();
      const { error } = await sb.from("families").select("id", { count: "exact", head: true });
      checks.db = error ? "fail" : "ok";
    }
  } catch {
    checks.db = "fail";
  }

  const allOk = checks.db !== "fail" && checks.groq !== "fail";
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      uptime: process.uptime?.() ?? 0,
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
