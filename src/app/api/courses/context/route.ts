import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SCHOOL_TOOLS } from "@/lib/content/school-world";

export const runtime = "nodejs";

const VALID_MODES = new Set(SCHOOL_TOOLS.map((t) => t.key));

const Body = z.object({
  courseId: z.string().uuid(),
  currentTheme: z.string().max(120).nullable().optional(),
  currentContext: z.string().max(1000).nullable().optional(),
  // Mundo "Lumi en tu Colegio": mensaje del profesor + herramientas activas.
  worldMessage: z.string().max(400).nullable().optional(),
  enabledModes: z.array(z.string().max(40)).max(20).nullable().optional(),
  // Misión grupal: meta semanal de XP del curso (null = sin misión).
  weeklyGoalXp: z.number().int().min(100).max(100000).nullable().optional(),
});

/**
 * El profesor (o admin) personaliza su curso: tema de la semana, contexto para
 * la IA, mensaje del mundo del colegio y herramientas activas.
 * RLS garantiza que solo puede tocar cursos que dicta o administra.
 * Solo se actualizan los campos presentes en el body (updates parciales).
 */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const update: Record<string, unknown> = {};

  if (body.currentTheme !== undefined || body.currentContext !== undefined) {
    update.current_theme = body.currentTheme?.trim() || null;
    update.current_context = body.currentContext?.trim() || null;
    update.context_updated_at = new Date().toISOString();
  }
  if (body.worldMessage !== undefined) {
    update.world_message = body.worldMessage?.trim() || null;
  }
  if (body.enabledModes !== undefined) {
    const clean = (body.enabledModes ?? []).filter((m) => VALID_MODES.has(m));
    update.enabled_modes = clean.length ? clean : null; // null = set por defecto
  }
  if (body.weeklyGoalXp !== undefined) {
    update.weekly_goal_xp = body.weeklyGoalXp;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { error } = await supabase
    .from("courses")
    .update(update)
    .eq("id", body.courseId);

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}
