import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { audit } from "@/lib/superadmin/auth";
import { createDiscountCode, removeDiscountCode } from "@/lib/payments/lemonsqueezy";

export const runtime = "nodejs";

const CreateBody = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,40}$/, "Solo letras, números y guiones (3-40)"),
  percent: z.number().int().min(1).max(100),
  duration: z.enum(["once", "repeating", "forever"]),
  durationMonths: z.number().int().min(1).max(36).optional(),
  maxRedemptions: z.number().int().min(1).max(100000),
  expiresDays: z.number().int().min(1).max(730).nullable().optional(),
  note: z.string().trim().max(200).optional(),
});

/** Crea un código de descuento: primero en Lemon Squeezy, luego en el registro local. */
export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: z.infer<typeof CreateBody>;
  try {
    body = CreateBody.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.errors[0]?.message : "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ¿Código repetido en el registro local?
  const { data: existing } = await auth.svc
    .from("discount_codes")
    .select("id")
    .eq("code", body.code)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "Ese código ya existe." }, { status: 400 });

  const expiresAt = body.expiresDays
    ? new Date(Date.now() + body.expiresDays * 86_400_000).toISOString()
    : null;

  // 1. Crear en Lemon Squeezy (la validación al pago la hace LS automáticamente).
  const ls = await createDiscountCode({
    code: body.code,
    name: body.note || `Código ${body.code}`,
    percent: body.percent,
    duration: body.duration,
    durationMonths: body.durationMonths,
    maxRedemptions: body.maxRedemptions,
    expiresAt,
  });
  if ("error" in ls) {
    const friendly = /not configured/i.test(ls.error)
      ? "Lemon Squeezy aún no está configurado (tarea 2 de la ruta). Configúralo y vuelve a intentar."
      : `Lemon Squeezy rechazó el código: ${ls.error}`;
    return NextResponse.json({ error: friendly }, { status: 502 });
  }

  // 2. Registro local (para el panel y el control de uso).
  const { error: dbErr } = await auth.svc.from("discount_codes").insert({
    code: body.code,
    percent: body.percent,
    duration: body.duration,
    duration_months: body.duration === "repeating" ? (body.durationMonths ?? 1) : null,
    max_redemptions: body.maxRedemptions,
    expires_at: expiresAt,
    ls_discount_id: ls.lsId,
    note: body.note ?? null,
  });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  await audit(auth.svc, auth.userId, "code_created", { code: body.code, percent: body.percent });
  return NextResponse.json({ ok: true, code: body.code });
}

const PatchBody = z.object({ id: z.string().uuid() });

/** Desactiva un código: lo elimina en Lemon Squeezy y lo marca inactivo. */
export async function PATCH(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data: row } = await auth.svc
    .from("discount_codes")
    .select("id, code, ls_discount_id, active")
    .eq("id", body.id)
    .single();
  if (!row) return NextResponse.json({ error: "Código no encontrado" }, { status: 404 });
  if (!row.active) return NextResponse.json({ ok: true });

  if (row.ls_discount_id) await removeDiscountCode(row.ls_discount_id);
  await auth.svc.from("discount_codes").update({ active: false }).eq("id", row.id);
  await audit(auth.svc, auth.userId, "code_deactivated", { code: row.code });

  return NextResponse.json({ ok: true });
}
