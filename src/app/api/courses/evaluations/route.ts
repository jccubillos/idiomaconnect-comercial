import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateBody = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  content: z.string().trim().min(10).max(4000),
});

/**
 * El profesor carga una EVALUACIÓN de entrenamiento para su curso: pega la
 * materia o preguntas, y la IA la convierte en práctica dentro del mundo
 * "Lumi en tu Colegio". RLS limita a profesores del curso o admin del colegio.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof CreateBody>;
  try { body = CreateBody.parse(await req.json()); }
  catch (e) {
    const msg = e instanceof z.ZodError ? e.errors[0]?.message : "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { error } = await supabase.from("course_evaluations").insert({
    course_id: body.courseId,
    title: body.title,
    content: body.content,
  });
  if (error) {
    const friendly = error.message.includes("course_evaluations")
      ? "Falta aplicar la migración 0011 en la base de datos."
      : error.message;
    return NextResponse.json({ error: friendly }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

const PatchBody = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});

/** Activa o desactiva una evaluación (desactivada deja de verse en el mundo). */
export async function PATCH(req: Request) {
  let body: z.infer<typeof PatchBody>;
  try { body = PatchBody.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { error } = await supabase
    .from("course_evaluations")
    .update({ active: body.active })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}
