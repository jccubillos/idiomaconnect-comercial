import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { resolveRole } from "@/lib/auth/role";
import { CourseContextForm } from "@/components/school/CourseContextForm";
import {
  summarizeStudent,
  aggregateCourse,
  lastActiveLabel,
  type StudentSessionLite,
  type StudentSummary,
} from "@/lib/school/roster";

export const dynamic = "force-dynamic";

export default async function CourseDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { role } = await resolveRole(supabase, user.id);
  if (role === "family") redirect("/profiles");

  // RLS limita esto a cursos que el usuario dicta o administra.
  const { data: course } = await supabase
    .from("courses")
    .select("id, name, grade_label, current_theme, current_context, org_id")
    .eq("id", params.id)
    .single();
  if (!course) notFound();

  // Alumnos del curso.
  const { data: students = [] } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, color_hex, total_xp, hobbies")
    .eq("course_id", params.id)
    .is("archived_at", null)
    .order("name", { ascending: true });

  const ids = (students ?? []).map((s) => s.id);

  // Sesiones de todos los alumnos del curso.
  const { data: sessions = [] } = ids.length
    ? await supabase
        .from("lesson_sessions")
        .select("kid_id, skill, world_key, lesson_type, score_pct, xp_gained, created_at")
        .in("kid_id", ids)
    : { data: [] };

  const sessionRows = (sessions ?? []) as StudentSessionLite[];
  const now = new Date();
  const summaries: StudentSummary[] = (students ?? []).map((s) =>
    summarizeStudent(s.id, s.total_xp, sessionRows, now),
  );
  const byId = new Map(summaries.map((s) => [s.kidId, s]));

  const sevenAgo = now.getTime() - 7 * 86_400_000;
  const sessions7 = sessionRows.filter((s) => new Date(s.created_at).getTime() >= sevenAgo).length;
  const agg = aggregateCourse(summaries, sessions7, sessionRows.length);

  return (
    <main className="pt-10 pb-24 px-5 max-w-5xl mx-auto relative z-10">
      <Link href="/teacher" className="text-sm font-bold text-neon-cyan">← Mis cursos</Link>

      <header className="mt-3 mb-6">
        <h1 className="text-3xl font-extrabold text-neon-cyan">{course.name}</h1>
        {course.grade_label && <p className="text-sm text-ink-dim">{course.grade_label}</p>}
      </header>

      {/* Stats del curso */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Alumnos" value={agg.students} />
        <Stat label="Activos (7 días)" value={`${agg.activeStudents7}/${agg.students}`} accent="green" />
        <Stat label="Sesiones (7 días)" value={agg.sessions7} />
        <Stat label="Promedio aciertos" value={`${agg.avgScore}%`} accent="purple" />
      </div>

      {/* FASE 2 — Tema de la semana */}
      <div className="mb-8">
        <CourseContextForm
          courseId={course.id}
          initialTheme={course.current_theme}
          initialContext={course.current_context}
        />
      </div>

      {/* Roster */}
      <h2 className="text-lg font-extrabold mb-3">Avance por alumno</h2>
      {(!students || students.length === 0) ? (
        <GlassCard className="p-8 text-center">
          <div className="text-4xl mb-3">🧑‍🎓</div>
          <p className="text-sm text-ink-dim">
            Este curso aún no tiene alumnos. El administrador del colegio puede agregarlos.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-dim border-b border-white/10">
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-3 py-3">Nivel</th>
                  <th className="px-3 py-3">XP</th>
                  <th className="px-3 py-3">Sesiones</th>
                  <th className="px-3 py-3">Aciertos</th>
                  <th className="px-3 py-3">Racha</th>
                  <th className="px-3 py-3">Última act.</th>
                </tr>
              </thead>
              <tbody>
                {(students ?? []).map((s) => {
                  const sum = byId.get(s.id)!;
                  const inactive = sum.activeLast7 === 0;
                  return (
                    <tr key={s.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 font-bold">
                        <span className="mr-2">{s.emoji ?? "👤"}</span>{s.name}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-bold" style={{ color: s.color_hex }}>{sum.cefrCode}</span>
                      </td>
                      <td className="px-3 py-3">{sum.totalXp}</td>
                      <td className="px-3 py-3">{sum.sessions}</td>
                      <td className="px-3 py-3">{sum.sessions ? `${sum.avgScore}%` : "—"}</td>
                      <td className="px-3 py-3">{sum.streakDays > 0 ? `🔥 ${sum.streakDays}` : "—"}</td>
                      <td className={`px-3 py-3 ${inactive ? "text-neon-red" : "text-ink-dim"}`}>
                        {lastActiveLabel(sum.lastActive, now)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
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
