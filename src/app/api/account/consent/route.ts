import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Registra la aceptación de términos, privacidad y consentimiento parental para
 * cuentas creadas antes de que el registro guardara estas fechas.
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("families")
    .update({ tos_accepted_at: now, privacy_accepted_at: now, parental_consent_at: now })
    .eq("owner_user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
