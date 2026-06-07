import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

const Body = z.object({
  fullName: z.string().min(1).max(80),
  email: z.string().email(),
  courseId: z.string().uuid().nullable().optional(),
});

/** Genera una contraseña temporal legible. */
function tempPassword(): string {
  const a = ["Sol", "Mar", "Luz", "Río", "Cielo", "Nube", "Lago", "Bosque"];
  const w = a[Math.floor(Math.random() * a.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-${n}-IC`;
}

/**
 * Crea la cuenta de un PROFESOR: usuario auth + membresía staff + (opcional)
 * asignación a un curso. Devuelve una contraseña temporal para entregarle.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const email = body.email.trim().toLowerCase();
  const password = tempPassword();

  let svc;
  try { svc = createServiceClient(); }
  catch { return NextResponse.json({ error: "Servidor sin configuración de administración (service role)." }, { status: 500 }); }

  // 1. Crear usuario auth (confirmado).
  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { family_name: `Prof. ${body.fullName}` },
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "No se pudo crear la cuenta";
    const friendly = /already|exists|registered/i.test(msg)
      ? "Ya existe una cuenta con ese correo."
      : msg;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }
  const teacherId = created.user.id;

  // 2. Membresía de staff (profesor) en el colegio del admin.
  const { error: staffErr } = await svc.from("staff_members").insert({
    org_id: auth.orgId,
    user_id: teacherId,
    role: "teacher",
    full_name: body.fullName.trim(),
  });
  if (staffErr) {
    return NextResponse.json({ error: `Cuenta creada pero falló la membresía: ${staffErr.message}` }, { status: 500 });
  }

  // 3. Asignación opcional a un curso (validando que el curso sea del colegio).
  if (body.courseId) {
    const supabase = createClient();
    const { data: course } = await supabase
      .from("courses")
      .select("id, org_id")
      .eq("id", body.courseId)
      .single();
    if (course && course.org_id === auth.orgId) {
      await svc.from("course_teachers").insert({ course_id: body.courseId, user_id: teacherId });
    }
  }

  return NextResponse.json({ ok: true, email, password });
}
