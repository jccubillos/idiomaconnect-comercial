import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * EXPORTACIÓN DE DATOS (derecho de portabilidad — GDPR/COPPA/Ley 21.719).
 * Descarga un JSON con TODOS los datos de la familia: perfiles, miembros,
 * sesiones de práctica, tarjetas de repaso y trofeos.
 * RLS garantiza que solo se exportan los datos de la propia familia.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: family } = await supabase
    .from("families")
    .select("id, family_name, plan, org_type, trial_ends_at, created_at")
    .eq("owner_user_id", user.id)
    .single();
  if (!family) return NextResponse.json({ error: "Cuenta sin datos" }, { status: 404 });

  const [{ data: kids = [] }, { data: members = [] }] = await Promise.all([
    supabase
      .from("kid_profiles")
      .select("id, name, birth_date, emoji, hobbies, tone, grade, total_xp, cefr_level, current_world, created_at")
      .eq("family_id", family.id),
    supabase
      .from("family_members")
      .select("relation, name, age, notes, created_at")
      .eq("family_id", family.id),
  ]);

  const kidIds = (kids ?? []).map((k) => k.id);
  const [{ data: sessions = [] }, { data: srs = [] }, { data: trophies = [] }] = kidIds.length
    ? await Promise.all([
        supabase
          .from("lesson_sessions")
          .select("kid_id, world_key, lesson_type, topic, skill, score_pct, xp_gained, duration_seconds, created_at")
          .in("kid_id", kidIds),
        supabase
          .from("srs_cards")
          .select("kid_id, word_en, translation_es, example_sentence, interval_days, repetition, due_at, created_at")
          .in("kid_id", kidIds),
        supabase
          .from("trophies_earned")
          .select("kid_id, trophy_key, earned_at")
          .in("kid_id", kidIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const exportData = {
    exportadoEl: new Date().toISOString(),
    cuenta: { email: user.email, ...family },
    perfiles: kids ?? [],
    miembrosFamilia: members ?? [],
    sesionesDePractica: sessions ?? [],
    tarjetasDeRepaso: srs ?? [],
    trofeos: trophies ?? [],
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="idiomaconnect-datos-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
