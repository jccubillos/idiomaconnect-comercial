import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { resolveRole } from "@/lib/auth/role";
import { CourseContextForm } from "@/components/school/CourseContextForm";
import { SchoolWorldManager } from "@/components/school/SchoolWorldManager";
import { PanelTabs } from "@/components/school/PanelTabs";
import { SCHOOL_WORLD_KEY } from "@/lib/content/school-world";
import { computeSchoolStreak, weekStart } from "@/lib/school/school-streak";
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
    .select("id, name, grade_label, current_theme, current_context, world_message, enabled_modes, weekly_goal_xp, org_id")
    .eq("id", params.id)
    .single();
  if (!course) notFound();

  // Evaluaciones del mundo del colegio (activas e inactivas, para gestionarlas).
  const { data: evaluations = [] } = await supabase
    .from("course_evaluations")
    .select("id, title, active")
    .eq("course_id", params.id)
    .order("created_at", { ascending: false });

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

  // SEPARACIÓN: lo del mundo del colegio vs el resto de la app.
  const schoolRows = sessionRows.filter((s) => s.world_key === SCHOOL_WORLD_KEY);
  const otherRows = sessionRows.filter((s) => s.world_key !== SCHOOL_WORLD_KEY);

  const otherSummaries: StudentSummary[] = (students ?? []).map((s) =>
    summarizeStudent(s.id, s.total_xp, otherRows, now),
  );
  const otherById = new Map(otherSummaries.map((s) => [s.kidId, s]));

  const schoolSummaries: StudentSummary[] = (students ?? []).map((s) =>
    summarizeStudent(s.id, s.total_xp, schoolRows, now),
  );
  const schoolById = new Map(schoolSummaries.map((s) => [s.kidId, s]));
  const schoolStreakById = new Map(
    (students ?? []).map((s) => [
      s.id,
      computeSchoolStreak(schoolRows.filter((r) => r.kid_id === s.id), now),
    ]),
  );
  const schoolXpById = new Map(
    (students ?? []).map((s) => [
      s.id,
      schoolRows.filter((r) => r.kid_id === s.id).reduce((a, r) => a + (r.xp_gained ?? 0), 0),
    ]),
  );

  const sevenAgo = now.getTime() - 7 * 86_400_000;
  const sessions7 = sessionRows.filter((s) => new Date(s.created_at).getTime() >= sevenAgo).length;
  const allSummaries = (students ?? []).map((s) => summarizeStudent(s.id, s.total_xp, sessionRows, now));
  const agg = aggregateCourse(allSummaries, sessions7, sessionRows.length);

  const hasStudents = (students ?? []).length > 0;

  // MISIÓN GRUPAL: progreso semanal del curso en el mundo del colegio.
  const monday = weekStart(now);
  const courseWeekXp = schoolRows
    .filter((s) => new Date(s.created_at).getTime() >= monday.getTime())
    .reduce((a, s) => a + (s.xp_gained ?? 0), 0);
  const weeklyGoal = course.weekly_goal_xp;

  // INFORME PRE-PRUEBA: entrenamiento por evaluación (rawPayload.evaluationId).
  const { data: evalSessions = [] } = ids.length
    ? await supabase
        .from("lesson_sessions")
        .select("kid_id, score_pct, raw_payload")
        .in("kid_id", ids)
        .eq("world_key", SCHOOL_WORLD_KEY)
        .not("raw_payload", "is", null)
    : { data: [] };

  const studentName = new Map((students ?? []).map((s) => [s.id, s.name]));
  const activeEvals = (evaluations ?? []).filter((e) => e.active);
  const evalReports = activeEvals.map((ev) => {
    const rows = (evalSessions ?? []).filter(
      (r) => (r.raw_payload as { evaluationId?: string } | null)?.evaluationId === ev.id,
    );
    const perStudent = new Map<string, { count: number; sum: number }>();
    for (const r of rows) {
      const cur = perStudent.get(r.kid_id) ?? { count: 0, sum: 0 };
      perStudent.set(r.kid_id, { count: cur.count + 1, sum: cur.sum + (r.score_pct ?? 0) });
    }
    const trained = Array.from(perStudent.entries()).map(([kidId, v]) => ({
      name: studentName.get(kidId) ?? "Alumno",
      count: v.count,
      avg: Math.round(v.sum / v.count),
    })).sort((a, b) => b.avg - a.avg);
    const untrained = (students ?? [])
      .filter((s) => !perStudent.has(s.id))
      .map((s) => s.name);
    return { id: ev.id, title: ev.title, trained, untrained };
  });

  return (
    <main className="pt-10 pb-24 px-5 max-w-5xl mx-auto relative z-10">
      <Link href="/teacher" className="text-sm font-bold text-neon-cyan">← Mis cursos</Link>

      <header className="mt-3 mb-6">
        <h1 className="text-3xl font-extrabold text-neon-cyan">{course.name}</h1>
        {course.grade_label && <p className="text-sm text-ink-dim">{course.grade_label}</p>}
      </header>

      {/* Stats del curso (toda la app) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Alumnos" value={agg.students} />
        <Stat label="Activos (7 días)" value={`${agg.activeStudents7}/${agg.students}`} accent="green" />
        <Stat label="Sesiones (7 días)" value={agg.sessions7} />
        <Stat label="Promedio aciertos" value={`${agg.avgScore}%`} accent="purple" />
      </div>

      {/* Tema de la semana (alimenta toda la app del alumno) */}
      <div className="mb-6">
        <CourseContextForm
          courseId={course.id}
          initialTheme={course.current_theme}
          initialContext={course.current_context}
        />
      </div>

      {/* Mundo "Lumi en tu Colegio" — personalización del profesor */}
      <SchoolWorldManager
        courseId={course.id}
        initialMessage={course.world_message}
        initialModes={course.enabled_modes as string[] | null}
        initialWeeklyGoal={course.weekly_goal_xp}
        evaluations={(evaluations ?? []).map((e) => ({ id: e.id, title: e.title, active: e.active }))}
      />

      {/* Misión grupal — progreso de la semana */}
      {weeklyGoal != null && (
        <GlassCard className="p-4 mb-6 border border-neon-green/40">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-sm font-extrabold">🚀 Misión del curso (semana actual)</span>
            <span className={`text-sm font-bold ${courseWeekXp >= weeklyGoal ? "text-neon-green" : "text-ink-dim"}`}>
              {courseWeekXp} / {weeklyGoal} XP {courseWeekXp >= weeklyGoal ? "· ¡CUMPLIDA! 🎉" : ""}
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (courseWeekXp / weeklyGoal) * 100)}%`, background: "linear-gradient(90deg,#39ff14,#00eefc)" }}
            />
          </div>
        </GlassCard>
      )}

      {/* Informe pre-prueba — quién entrenó cada evaluación */}
      {evalReports.length > 0 && (
        <GlassCard strong className="p-5 mb-6 border border-neon-green/30">
          <h2 className="font-extrabold mb-1">📋 Informe de entrenamiento por evaluación</h2>
          <p className="text-xs text-ink-dim mb-4">
            Quién ha entrenado cada evaluación en el mundo del colegio y con qué % de aciertos.
            Revísalo el día antes de la prueba real.
          </p>
          <div className="space-y-4">
            {evalReports.map((r) => (
              <div key={r.id} className="border-b border-white/5 pb-3 last:border-0">
                <div className="font-bold text-sm mb-2">🎯 {r.title}</div>
                {r.trained.length === 0 ? (
                  <p className="text-xs text-neon-red">Nadie ha entrenado esta evaluación todavía.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {r.trained.map((t) => (
                      <span
                        key={t.name}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          t.avg >= 70
                            ? "bg-neon-green/10 text-neon-green border-neon-green/30"
                            : "bg-neon-red/10 text-neon-red border-neon-red/30"
                        }`}
                      >
                        {t.name} · {t.count}× · {t.avg}%
                      </span>
                    ))}
                  </div>
                )}
                {r.untrained.length > 0 && (
                  <p className="text-[11px] text-ink-dim">
                    Sin entrenar: <span className="text-neon-red">{r.untrained.join(", ")}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Avance por alumno — separado por origen */}
      <h2 className="text-lg font-extrabold mb-3">Avance por alumno</h2>
      {!hasStudents ? (
        <GlassCard className="p-8 text-center">
          <div className="text-4xl mb-3">🧑‍🎓</div>
          <p className="text-sm text-ink-dim">
            Este curso aún no tiene alumnos. El administrador del colegio puede agregarlos.
          </p>
        </GlassCard>
      ) : (
        <PanelTabs
          tabs={[
            {
              label: "🏫 Mundo del colegio",
              content: (
                <GlassCard className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-ink-dim border-b border-white/10">
                          <th className="px-4 py-3">Alumno</th>
                          <th className="px-3 py-3">Racha colegio</th>
                          <th className="px-3 py-3">XP en el mundo</th>
                          <th className="px-3 py-3">Sesiones</th>
                          <th className="px-3 py-3">Aciertos</th>
                          <th className="px-3 py-3">Última act.</th>
                          <th className="px-3 py-3">Premiar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(students ?? []).map((s) => {
                          const sum = schoolById.get(s.id)!;
                          const streak = schoolStreakById.get(s.id) ?? 0;
                          return (
                            <tr key={s.id} className="border-b border-white/5 last:border-0">
                              <td className="px-4 py-3 font-bold">
                                <span className="mr-2">{s.emoji ?? "👤"}</span>{s.name}
                              </td>
                              <td className="px-3 py-3">{streak > 0 ? `🔥 ${streak} día(s)` : "—"}</td>
                              <td className="px-3 py-3">{schoolXpById.get(s.id) ?? 0}</td>
                              <td className="px-3 py-3">{sum.sessions}</td>
                              <td className="px-3 py-3">{sum.sessions ? `${sum.avgScore}%` : "—"}</td>
                              <td className="px-3 py-3 text-ink-dim">{lastActiveLabel(sum.lastActive, now)}</td>
                              <td className="px-3 py-3">
                                <Link
                                  href={`/certificado?kid=${s.id}`}
                                  className="text-neon-purple hover:underline text-xs font-bold"
                                  title="Imprimir certificado de logro"
                                >
                                  🎖 Certificado
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-ink-dim px-4 py-3">
                    🔥 Racha colegio: días seguidos con 100+ XP ganados dentro de “Lumi en tu Colegio”.
                  </p>
                </GlassCard>
              ),
            },
            {
              label: "🌍 Resto de la app",
              content: (
                <GlassCard className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-ink-dim border-b border-white/10">
                          <th className="px-4 py-3">Alumno</th>
                          <th className="px-3 py-3">Nivel</th>
                          <th className="px-3 py-3">XP total</th>
                          <th className="px-3 py-3">Sesiones</th>
                          <th className="px-3 py-3">Aciertos</th>
                          <th className="px-3 py-3">Racha general</th>
                          <th className="px-3 py-3">Última act.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(students ?? []).map((s) => {
                          const sum = otherById.get(s.id)!;
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
              ),
            },
          ]}
        />
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
