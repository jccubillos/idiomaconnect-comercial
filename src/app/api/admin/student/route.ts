import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(1).max(60),
  courseId: z.string().uuid().nullable().optional(),
  grade: z.string().max(40).optional(),
  hobbies: z.string().max(300).optional(),
});

/**
 * Crear un alumno (kid_profile) dentro del colegio. Respeta el cupo (seats).
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const supabase = createClient();

  // Control de cupos.
  const { data: org } = await supabase
    .from("families")
    .select("seats")
    .eq("id", auth.orgId)
    .single();

  if (org?.seats != null) {
    const { count } = await supabase
      .from("kid_profiles")
      .select("id", { count: "exact", head: true })
      .eq("family_id", auth.orgId)
      .is("archived_at", null);
    if ((count ?? 0) >= org.seats) {
      return NextResponse.json(
        { error: `Alcanzaste el cupo contratado (${org.seats} alumnos). Contáctanos para ampliarlo.` },
        { status: 409 },
      );
    }
  }

  const { data, error } = await supabase
    .from("kid_profiles")
    .insert({
      family_id: auth.orgId,
      name: body.name.trim(),
      course_id: body.courseId ?? null,
      grade: body.grade?.trim() || null,
      hobbies: body.hobbies?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, studentId: data.id });
}
