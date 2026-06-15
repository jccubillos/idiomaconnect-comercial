import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hasPlusAccess } from "@/lib/billing/access";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const WordSchema = z.object({
  en: z.string().min(1).max(60),
  es: z.string().min(1).max(80),
  pron: z.string().max(80).default(""),
  options: z.array(z.string().min(1).max(80)).min(2).max(6),
});

const Body = z.object({
  challengerKidId: z.string().uuid(),
  targetKidId: z.string().uuid(),
  scorePct: z.number().int().min(0).max(100),
  words: z.array(WordSchema).min(4).max(20),
});

/**
 * ⚔️ DESAFÍO A UN COMPAÑERO de curso (variante escolar del reto). El retado lo ve
 * en SU mundo del colegio y lo juega con las mismas palabras. Crea el reto en
 * battle_challenges (reusa el reproductor /reto/<id>/jugar) + el puntero al curso.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  if (body.challengerKidId === body.targetKidId) {
    return NextResponse.json({ error: "No puedes retarte a ti mismo." }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rl = checkRateLimit(`coursechallenge:${user.id}`, { limit: 15, windowSec: 3600 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiados desafíos seguidos. Intenta en un rato." }, { status: 429 });
  }

  // El retador debe ser un alumno (kid con curso) accesible por el usuario (RLS).
  const { data: challenger } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, cefr_level, family_id, course_id")
    .eq("id", body.challengerKidId)
    .single();
  if (!challenger || !challenger.course_id) {
    return NextResponse.json({ error: "Solo los alumnos de un curso pueden retar a compañeros." }, { status: 403 });
  }

  // Candado de acceso (los planes school tienen herramientas Plus).
  const { data: fam } = await supabase
    .from("families")
    .select("plan, trial_ends_at")
    .eq("id", challenger.family_id)
    .single();
  if (!fam || !hasPlusAccess(fam)) {
    return NextResponse.json({ error: "Acceso no disponible.", code: "plus_required" }, { status: 403 });
  }

  // El retado debe existir y estar en el MISMO curso (verificado en servidor).
  const svc = createServiceClient();
  const { data: target } = await svc
    .from("kid_profiles")
    .select("id, course_id, archived_at")
    .eq("id", body.targetKidId)
    .single();
  if (!target || target.archived_at || target.course_id !== challenger.course_id) {
    return NextResponse.json({ error: "Ese compañero no está en tu curso." }, { status: 400 });
  }

  // 1. Crea el reto base (mismas palabras + puntaje del retador).
  const { data: row, error } = await svc
    .from("battle_challenges")
    .insert({
      creator_kid_id: challenger.id,
      creator_name: challenger.name,
      creator_emoji: challenger.emoji,
      creator_level: challenger.cefr_level,
      score_pct: body.scorePct,
      words: body.words as never,
    })
    .select("id")
    .single();
  if (error || !row) {
    const friendly = error?.message.includes("battle_challenges")
      ? "Falta aplicar la migración 0015 en la base de datos."
      : "No se pudo crear el desafío. Intenta de nuevo.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }

  // 2. Apunta el reto al compañero, dentro del curso.
  const { error: ptrErr } = await svc.from("course_challenge_targets").insert({
    challenge_id: row.id,
    course_id: challenger.course_id,
    challenger_kid_id: challenger.id,
    target_kid_id: target.id,
    challenger_name: challenger.name,
    challenger_score: body.scorePct,
  });
  if (ptrErr) {
    const friendly = ptrErr.message.includes("course_challenge_targets")
      ? "Falta aplicar la migración 0019 en la base de datos."
      : "No se pudo enviar el desafío. Intenta de nuevo.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
