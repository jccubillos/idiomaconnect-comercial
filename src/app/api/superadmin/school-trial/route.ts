import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { audit } from "@/lib/superadmin/auth";

export const runtime = "nodejs";

const Body = z.object({
  familyId: z.string().uuid(),
  action: z.enum(["pilot", "activate", "expire"]),
  days: z.number().int().min(7).max(180).optional(), // duración del piloto
});

/**
 * Gestión del estado comercial de un COLEGIO desde el dashboard de administración.
 *  · pilot    → lo convierte en PILOTO con fecha de término (plan 'trial' extendido).
 *               Los pilotos NO cuentan como venta en las métricas.
 *  · activate → contrato real firmado (plan 'school'): cuenta como venta.
 *  · expire   → termina el acceso (piloto que no compró / contrato terminado).
 *
 * Los pilotos de colegio se otorgan SOLO desde aquí (no autoservicio): cada
 * piloto nace de una conversación comercial y con urgencia (fecha de término).
 */
export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const { data: fam } = await auth.svc
    .from("families")
    .select("id, family_name, org_type, plan")
    .eq("id", body.familyId)
    .single();
  if (!fam) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  if (fam.org_type !== "school") {
    return NextResponse.json({ error: "Esta acción es solo para cuentas de colegio." }, { status: 400 });
  }

  const update: Record<string, unknown> =
    body.action === "pilot"
      ? {
          plan: "trial",
          trial_ends_at: new Date(Date.now() + (body.days ?? 60) * 86_400_000).toISOString(),
        }
      : body.action === "activate"
        ? { plan: "school", payment_failed_at: null }
        : { plan: "expired" };

  const { error } = await auth.svc.from("families").update(update).eq("id", fam.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(auth.svc, auth.userId, `school_${body.action}`, {
    familyId: fam.id,
    name: fam.family_name,
    days: body.days ?? null,
  });

  const info =
    body.action === "pilot"
      ? `${fam.family_name} ahora es PILOTO por ${body.days ?? 60} días.`
      : body.action === "activate"
        ? `${fam.family_name} activado como contrato real.`
        : `${fam.family_name} marcado como expirado.`;
  return NextResponse.json({ ok: true, info });
}
