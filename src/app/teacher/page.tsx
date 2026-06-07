import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { resolveRole } from "@/lib/auth/role";

export const dynamic = "force-dynamic";

export default async function TeacherHome() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { role, orgId } = await resolveRole(supabase, user.id);
  if (role === "family") redirect("/profiles");
  // Un admin también puede ver el panel de profesor, pero por defecto va a /school-admin.

  // Cursos asignados a este profesor.
  const { data: assigns = [] } = await supabase
    .from("course_teachers")
    .select("course_id")
    .eq("user_id", user.id);
  const courseIds = (assigns ?? []).map((a) => a.course_id);

  const { data: courses = [] } = courseIds.length
    ? await supabase
        .from("courses")
        .select("id, name, grade_label, current_theme")
        .in("id", courseIds)
        .is("archived_at", null)
        .order("name", { ascending: true })
    : { data: [] };

  // Nombre del colegio + conteo de alumnos por curso.
  const { data: org } = orgId
    ? await supabase.from("families").select("family_name").eq("id", orgId).single()
    : { data: null };

  const countByCourse: Record<string, number> = {};
  if (courseIds.length) {
    const { data: kids = [] } = await supabase
      .from("kid_profiles")
      .select("id, course_id")
      .in("course_id", courseIds)
      .is("archived_at", null);
    for (const k of kids ?? []) {
      if (k.course_id) countByCourse[k.course_id] = (countByCourse[k.course_id] ?? 0) + 1;
    }
  }

  return (
    <main className="pt-10 pb-24 px-5 max-w-4xl mx-auto relative z-10">
      <header className="mb-8 flex justify-between items-start gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-1">
            👩‍🏫 Panel del profesor
          </div>
          <h1 className="text-3xl font-extrabold">Mis cursos</h1>
          {org?.family_name && (
            <p className="text-sm text-ink-dim mt-1">{org.family_name}</p>
          )}
        </div>
        <Link href="/aula">
          <NeonButton variant="primary" size="sm">▶ Modo aula</NeonButton>
        </Link>
      </header>

      {(!courses || courses.length === 0) ? (
        <GlassCard className="p-8 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h2 className="font-bold mb-1">Aún no tienes cursos asignados</h2>
          <p className="text-sm text-ink-dim">
            Pídele al administrador del colegio que te asigne a uno o más cursos.
          </p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {courses.map((c) => (
            <Link key={c.id} href={`/teacher/course/${c.id}`}>
              <GlassCard className="p-5 h-full hover:scale-[1.02] transition-transform border border-white/10 hover:border-neon-cyan/40">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-extrabold text-neon-cyan">{c.name}</h3>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/5 text-ink-dim">
                    {countByCourse[c.id] ?? 0} alumnos
                  </span>
                </div>
                {c.grade_label && <p className="text-sm text-ink-dim mb-2">{c.grade_label}</p>}
                {c.current_theme ? (
                  <div className="text-xs text-neon-green">🎯 {c.current_theme}</div>
                ) : (
                  <div className="text-xs text-ink-dim italic">Sin tema de la semana</div>
                )}
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <SignOutButton />
      </div>
    </main>
  );
}
