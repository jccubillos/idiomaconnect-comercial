import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyFamilyParentPin } from "@/lib/parent-pin";

export const runtime = "nodejs";

const Body = z.object({
  adminPin: z.string().min(1, "Falta la clave de administrador"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres").max(72),
});

/**
 * Cambia la CLAVE DE ACCESO (login) de la cuenta, pero EXIGE primero la clave
 * de administrador (la del dashboard de padres). Así un niño no puede cambiar la
 * clave de acceso y dejar al padre fuera.
 *
 * La verificación del PIN es en el SERVIDOR (no se puede saltar desde el cliente)
 * y el cambio se hace con el cliente de servicio (admin), sin pedir la clave
 * actual ni reautenticación.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.errors[0]?.message : "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // 1. Verificar la clave de administrador (dashboard) ANTES de cambiar nada.
  const okPin = await verifyFamilyParentPin(supabase, user.id, body.adminPin);
  if (!okPin) {
    return NextResponse.json(
      { error: "Clave de administrador incorrecta." },
      { status: 403 },
    );
  }

  // 2. Cambiar la clave de acceso con el cliente de servicio (admin).
  let svc;
  try {
    svc = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Servidor sin configuración de administración." },
      { status: 500 },
    );
  }

  const { error } = await svc.auth.admin.updateUserById(user.id, {
    password: body.newPassword,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
