import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Body = z.object({
  courseId: z.string().uuid(),
  currentTheme: z.string().max(120).nullable().optional(),
  currentContext: z.string().max(1000).nullable().optional(),
});

/**
 * El profesor (o admin) define el "tema de la semana" del curso.
 * RLS garantiza que solo puede tocar cursos que dicta o administra.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const theme = body.currentTheme?.trim() || null;
  const ctx = body.currentContext?.trim() || null;

  const { error } = await supabase
    .from("courses")
    .update({
      current_theme: theme,
      current_context: ctx,
      context_updated_at: new Date().toISOString(),
    })
    .eq("id", body.courseId);

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}
