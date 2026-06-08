import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { verifyFamilyParentPin } from "@/lib/parent-pin";

export const runtime = "nodejs";

const BodySchema = z.object({
  password: z.string().min(1),
});

interface UsageBucket {
  event_type: string;
  events: number;
  costCents: number;
}

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await verifyFamilyParentPin(supabase, user.id, body.password))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const { data: events = [] } = await supabase
    .from("usage_events")
    .select("event_type, cost_usd_cents, tokens_used, created_at")
    .gte("created_at", since);

  const buckets: Record<string, UsageBucket> = {};
  let totalCents = 0;
  let totalTokens = 0;
  for (const e of events ?? []) {
    const k = e.event_type;
    if (!buckets[k]) buckets[k] = { event_type: k, events: 0, costCents: 0 };
    buckets[k].events += 1;
    buckets[k].costCents += e.cost_usd_cents ?? 0;
    totalCents += e.cost_usd_cents ?? 0;
    totalTokens += e.tokens_used ?? 0;
  }

  return NextResponse.json({
    windowDays: 30,
    totalEvents: (events ?? []).length,
    totalUsd: totalCents / 100,
    totalTokens,
    buckets: Object.values(buckets).sort((a, b) => b.costCents - a.costCents),
  });
}
