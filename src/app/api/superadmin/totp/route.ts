import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAppAdmin, audit, signAdminSession, ADMIN_COOKIE, ADMIN_SESSION_HOURS } from "@/lib/superadmin/auth";
import { newTotpSecret, totpUri, verifyTotp } from "@/lib/superadmin/totp";
import { enforceLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setup") }),
  z.object({ action: z.literal("verify"), code: z.string().min(6).max(10) }),
]);

/**
 * TOTP del dashboard admin.
 *  - setup : genera el secreto y devuelve el QR para Google Authenticator
 *            (solo permitido si aún NO hay un TOTP verificado — no se puede
 *             "re-enrolar" para robar el acceso).
 *  - verify: valida el código de 6 dígitos. Si es correcto, marca verificado
 *            y entrega la cookie de sesión admin (12 h).
 */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const svc = createServiceClient();
  const admin = await getAppAdmin(svc, user.id);
  // Discreción: para un no-admin esta ruta "no existe".
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "setup") {
    if (admin.totp_verified) {
      return NextResponse.json({ error: "El TOTP ya está configurado." }, { status: 400 });
    }
    // Reusa el secreto pendiente si existe (refrescos de página), si no genera uno.
    const secret = admin.totp_secret ?? newTotpSecret();
    if (!admin.totp_secret) {
      await svc.from("app_admins").update({ totp_secret: secret }).eq("user_id", user.id);
      await audit(svc, user.id, "totp_setup_started");
    }
    const uri = totpUri(secret, user.email ?? "admin");
    const qr = await QRCode.toDataURL(uri, { width: 240, margin: 1 });
    return NextResponse.json({ qr, secret });
  }

  // action === "verify"
  const rl = await enforceLimit(user.id, "adminTotp");
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Demasiados intentos. Espera ${Math.ceil(rl.resetIn / 60)} min.` },
      { status: 429 },
    );
  }

  if (!admin.totp_secret) {
    return NextResponse.json({ error: "Primero configura el autenticador." }, { status: 400 });
  }
  if (!verifyTotp(admin.totp_secret, body.code)) {
    await audit(svc, user.id, "totp_failed");
    return NextResponse.json({ error: "Código incorrecto. Intenta de nuevo." }, { status: 403 });
  }

  if (!admin.totp_verified) {
    await svc.from("app_admins").update({ totp_verified: true }).eq("user_id", user.id);
    await audit(svc, user.id, "totp_enrolled");
  }
  await audit(svc, user.id, "totp_login");

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, signAdminSession(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_HOURS * 3600,
  });
  return res;
}
