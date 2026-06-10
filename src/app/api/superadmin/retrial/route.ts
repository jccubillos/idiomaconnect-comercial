import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { audit } from "@/lib/superadmin/auth";

export const runtime = "nodejs";

const Body = z.object({ email: z.string().email() });

/**
 * Autoriza UN nuevo trial de 7 días para un correo que ya usó el suyo.
 * (La regla general es "1 trial por correo para siempre"; esta es la excepción
 * que solo puede dar la administración.)
 */
export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const { data: row } = await auth.svc
    .from("trial_registry")
    .select("email, retrial_authorized")
    .eq("email", email)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({
      ok: true,
      info: "Ese correo nunca ha usado un trial: puede registrarse normalmente y tendrá sus 7 días gratis.",
    });
  }
  if (row.retrial_authorized) {
    return NextResponse.json({ ok: true, info: "Ese correo ya tiene un re-trial autorizado pendiente de uso." });
  }

  const { error } = await auth.svc
    .from("trial_registry")
    .update({ retrial_authorized: true, retrial_authorized_at: new Date().toISOString() })
    .eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(auth.svc, auth.userId, "retrial_authorized", { email });
  return NextResponse.json({
    ok: true,
    info: `Listo: la próxima cuenta que se cree con ${email} tendrá 7 días de prueba.`,
  });
}
