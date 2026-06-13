import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Genera (o devuelve) el código de referido de la familia del usuario. */
function makeCode(name: string): string {
  const base = (name || "FAM").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "FAMILIA";
  return `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: family } = await supabase
    .from("families")
    .select("id, family_name, referral_code")
    .eq("owner_user_id", user.id)
    .single();
  if (!family) return NextResponse.json({ error: "Sin familia" }, { status: 404 });

  if (family.referral_code) {
    return NextResponse.json({ code: family.referral_code });
  }

  // Generar un código único (reintenta ante colisión).
  for (let i = 0; i < 5; i++) {
    const code = makeCode(family.family_name);
    const { error } = await supabase.from("families").update({ referral_code: code }).eq("id", family.id);
    if (!error) return NextResponse.json({ code });
  }
  return NextResponse.json({ error: "No se pudo generar el código." }, { status: 500 });
}
