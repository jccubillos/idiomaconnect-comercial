import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { resolveRole } from "@/lib/auth/role";
import { AdminConsole } from "@/components/school/AdminConsole";

export const dynamic = "force-dynamic";

export default async function SchoolAdminHome() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { role, orgId } = await resolveRole(supabase, user.id);
  if (role === "teacher") redirect("/teacher");
  if (role !== "school_admin" || !orgId) redirect("/profiles");

  const { data: org } = await supabase
    .from("families")
    .select("family_name, seats, plan")
    .eq("id", orgId)
    .single();

  // Cursos del colegio.
  const { data: courses = [] } = await supabase
    .from("courses")
    .select("id, name, grade_label")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("name", { ascending: true });

  // Profesores (staff role=teacher).
  const { data: teachers = [] } = await supabase
    .from("staff_members")
    .select("user_id, full_name")
    .eq("org_id", orgId)
    .eq("role", "teacher")
    .order("full_name", { ascending: true });

  // Alumnos del colegio (para conteo por curso y cupo).
  const { data: students = [] } = await supabase
    .from("kid_profiles")
    .select("id, course_id")
    .eq("family_id", orgId)
    .is("archived_at", null);

  // Asignaciones profesor↔curso.
  const courseIds = (courses ?? []).map((c) => c.id);
  const { data: assigns = [] } = courseIds.length
    ? await supabase.from("course_teachers").select("course_id, user_id").in("course_id", courseIds)
    : { data: [] };

  const teacherName = new Map((teachers ?? []).map((t) => [t.user_id, t.full_name ?? "Profesor"]));
  const studentsByCourse: Record<string, number> = {};
  for (const s of students ?? []) {
    if (s.course_id) studentsByCourse[s.course_id] = (studentsByCourse[s.course_id] ?? 0) + 1;
  }
  const teachersByCourse: Record<string, string[]> = {};
  for (const a of assigns ?? []) {
    (teachersByCourse[a.course_id] ??= []).push(teacherName.get(a.user_id) ?? "Profesor");
  }

  const totalStudents = (students ?? []).length;
  const seats = org?.seats ?? null;

  const coursesView = (courses ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    gradeLabel: c.grade_label,
    students: studentsByCourse[c.id] ?? 0,
    teachers: teachersByCourse[c.id] ?? [],
  }));
  const teachersView = (teachers ?? []).map((t) => ({ userId: t.user_id, name: t.full_name ?? "Profesor" }));

  return (
    <main className="pt-10 pb-24 px-5 max-w-5xl mx-auto relative z-10">
      <header className="flex justify-between items-start mb-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-neon-purple mb-1">
            🏫 Panel del colegio
          </div>
          <h1 className="text-3xl font-extrabold">{org?.family_name ?? "Mi colegio"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/aula"><NeonButton variant="primary" size="sm">▶ Modo aula</NeonButton></Link>
          <SignOutButton />
        </div>
      </header>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Cupos usados" value={seats != null ? `${totalStudents}/${seats}` : `${totalStudents}`} accent="purple" />
        <Stat label="Cursos" value={(courses ?? []).length} />
        <Stat label="Profesores" value={(teachers ?? []).length} accent="green" />
        <Stat label="Alumnos" value={totalStudents} />
      </div>

      <AdminConsole courses={coursesView} teachers={teachersView} />
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: "green" | "purple" }) {
  const color = accent === "green" ? "text-neon-green" : accent === "purple" ? "text-neon-purple" : "text-neon-cyan";
  return (
    <GlassCard className="p-4 text-center">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs text-ink-dim mt-1">{label}</div>
    </GlassCard>
  );
}
