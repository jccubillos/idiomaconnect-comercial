import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyFamilyParentPin } from "@/lib/parent-pin";

export const runtime = "nodejs";

/**
 * Account deletion — full data wipe.
 * Cascades from auth.users → families → kid_profiles → sessions/srs/trophies.
 * This is required by COPPA / GDPR-K right to be forgotten.
 *
 * Exige la clave de administrador (dashboard) para que un niño no pueda borrar
 * la cuenta de la familia.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "BORRAR") {
    return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
  }

  // Verificar la clave de administrador antes de un borrado irreversible.
  const okPin = await verifyFamilyParentPin(supabase, user.id, String(body.adminPin ?? ""));
  if (!okPin) {
    return NextResponse.json({ error: "Clave de administrador incorrecta." }, { status: 403 });
  }

  const admin = createServiceClient();

  // 1. Purga de Storage: los avatares NO se borran por cascada de la DB.
  //    Se guardan bajo `<family_id>/...` en el bucket `avatars` (ver 0003 storage).
  //    El derecho al olvido (COPPA/GDPR-K) exige eliminar también las imágenes subidas.
  const { data: family } = await admin
    .from("families")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();
  if (family) {
    try {
      const { data: files } = await admin.storage.from("avatars").list(family.id as string);
      if (files?.length) {
        await admin.storage
          .from("avatars")
          .remove(files.map((f) => `${family.id}/${f.name}`));
      }
    } catch {
      // No bloqueamos el borrado de la cuenta si la limpieza de storage falla;
      // los datos personales de la DB se eliminan igual en el paso 2.
    }
  }

  // 2. Borrar el usuario de auth → dispara ON DELETE CASCADE sobre families y el resto.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
