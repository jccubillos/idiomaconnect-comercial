import { NextResponse } from "next/server";

// DEPRECATED — Stripe doesn't support Chilean merchant accounts.
// All payment flows moved to /api/payments/* using Lemon Squeezy.
// This stub remains so legacy bookmarks fail loudly with 410 Gone.

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Stripe checkout removed",
      message: "Use /api/payments/checkout (Lemon Squeezy)",
      code: "gone",
    },
    { status: 410 },
  );
}
