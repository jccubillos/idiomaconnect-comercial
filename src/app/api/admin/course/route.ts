import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

const CreateBody = z.object({
  name: z.string().min(1).max(40),
  gradeLabel: z.string().max(40).optional(),
});

const AssignBody = z.object({
  courseId: z.string().uuid(),
  teacherUserId: z.string().uuid(),
});

/** Crear un curso. */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: z.infer<typeof CreateBody>;
  try { body = CreateBody.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({ org_id: auth.orgId, name: body.name.trim(), grade_label: body.gradeLabel?.trim() || null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, courseId: data.id });
}

/** Asignar un profesor a un curso. */
export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: z.infer<typeof AssignBody>;
  try { body = AssignBody.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const supabase = createClient();
  // El curso debe ser del colegio del admin (RLS lo refuerza igualmente).
  const { error } = await supabase
    .from("course_teachers")
    .upsert({ course_id: body.courseId, user_id: body.teacherUserId });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
