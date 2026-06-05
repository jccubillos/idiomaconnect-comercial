import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * Safe JSON body parse for API routes.
 * Returns either the validated value or a NextResponse to bail with.
 *
 * Usage:
 *   const parsed = await parseBody(req, BodySchema);
 *   if (parsed instanceof NextResponse) return parsed;
 *   const body = parsed;
 */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<z.infer<T> | NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    return NextResponse.json(
      { error: "Invalid body", details: r.error.errors.slice(0, 3).map((e) => ({ path: e.path, message: e.message })) },
      { status: 400 },
    );
  }
  return r.data;
}
