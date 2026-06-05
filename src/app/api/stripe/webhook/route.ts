import { NextResponse } from "next/server";

// DEPRECATED — see /api/payments/webhook (Lemon Squeezy).
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Stripe webhook removed", code: "gone" },
    { status: 410 },
  );
}
