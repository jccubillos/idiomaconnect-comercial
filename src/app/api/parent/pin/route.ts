import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hashParentPin } from "@/lib/parent-pin";

export const runtime = "nodejs";

const BodySchema = z.object({
  pin: z.string().min(4, "El PIN debe tener al menos 4 caracteres").max(64),
});

/**
 * Configura (o cambia) la clave del dashboard de padres para la familia
 * del usuario autenticado. Es DISTINTA de la clave de acceso (login).
 */
export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.errors[0]?.message : "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hash = hashParentPin(body.pin);

  const { error } = await supabase
    .from("families")
    .update({ parent_pin_hash: hash })
    .eq("owner_user_id", user.id);

  if (error) {
    // Si la columna aún no existe (migración 0007 sin aplicar), avisar claro.
    const msg = error.message.toLowerCase().includes("parent_pin_hash")
      ? "Falta aplicar la migración 0007 en la base de datos."
      : "No se pudo guardar la clave. Intenta de nuevo.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
