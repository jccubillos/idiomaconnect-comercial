import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createSubscriptionCheckout } from "@/lib/payments/lemonsqueezy";
import { parseBody } from "@/lib/api/parse-body";
import { log } from "@/lib/logging/logger";

export const runtime = "nodejs";

const Body = z.object({
  plan: z.enum(["monthly", "yearly", "plus", "lifetime"]),
  // Código de descuento opcional (también se puede escribir en el checkout).
  discountCode: z.string().trim().max(64).optional(),
});

export async function POST(req: Request) {
  const body = await parseBody(req, Body);
  if (body instanceof NextResponse) return body;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: family } = await supabase
    .from("families")
    .select("id, family_name")
    .eq("owner_user_id", user.id)
    .single();
  if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const result = await createSubscriptionCheckout({
    plan: body.plan,
    email: user.email,
    familyId: family.id,
    successUrl: `${appUrl}/profiles?subscribed=1`,
    discountCode: body.discountCode || undefined,
  });

  if ("error" in result) {
    log.error("payments.checkout.failed", { error: result.error });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Registrar el código usado (visible en el dashboard de administración).
  // Se sobreescribe en cada checkout: refleja el último intento de compra.
  await supabase
    .from("families")
    .update({ discount_code: body.discountCode?.trim().toUpperCase() || null })
    .eq("id", family.id);

  return NextResponse.json({ url: result.url });
}
