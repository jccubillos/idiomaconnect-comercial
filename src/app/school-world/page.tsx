import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import { LumiCharacter } from "@/components/coach/LumiCharacter";
import { SCHOOL_WORLD, SCHOOL_WORLD_KEY, enabledToolsFor } from "@/lib/content/school-world";
import { computeSchoolStreak, weekStart } from "@/lib/school/school-streak";
import { ProgressBar } from "@/components/ui/ProgressBar";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { kid?: string };
}

/**
 * "LUMI EN TU COLEGIO" — mundo exclusivo para alumnos de colegio.
 * Muestra el mensaje del profesor (vía Lumi), el tema del curso, las
 * herramientas que el profesor activó y las evaluaciones de entrenamiento.
 */
export default async function SchoolWorldPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, course_id")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");
  // Exclusivo de alumnos con curso: una familia jamás ve este mundo.
  if (!kid.course_id) redirect(`/worlds?kid=${kid.id}`);

  const { data: course } = await supabase
    .from("courses")
    .select("id, name, current_theme, world_message, enabled_modes, weekly_goal_xp")
    .eq("id", kid.course_id)
    .single();

  const { data: evaluations = [] } = await supabase
    .from("course_evaluations")
    .select("id, title")
    .eq("course_id", kid.course_id)
    .eq("active", true)
    .order("created_at", { ascending: false });

  // Racha del colegio (≥100 XP/día en este mundo).
  const { data: sessions = [] } = await supabase
    .from("lesson_sessions")
    .select("world_key, xp_gained, created_at")
    .eq("kid_id", kid.id)
    .eq("world_key", SCHOOL_WORLD_KEY);
  const streak = computeSchoolStreak(sessions ?? []);

  // LIGA DEL CURSO + MISIÓN GRUPAL: XP semanal de TODOS los compañeros en este mundo.
  const { data: classmates = [] } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, color_hex")
    .eq("course_id", kid.course_id)
    .is("archived_at", null);
  const mateIds = (classmates ?? []).map((c) => c.id);
  const monday = weekStart();
  const { data: weekRows = [] } = mateIds.length
    ? await supabase
        .from("lesson_sessions")
        .select("kid_id, xp_gained, lesson_type, score_pct")
        .in("kid_id", mateIds)
        .eq("world_key", SCHOOL_WORLD_KEY)
        .gte("created_at", monday.toISOString())
    : { data: [] };

  const weekXpById = new Map<string, number>();
  for (const r of weekRows ?? []) {
    weekXpById.set(r.kid_id, (weekXpById.get(r.kid_id) ?? 0) + (r.xp_gained ?? 0));
  }
  const ranking = (classmates ?? [])
    .map((c) => ({ ...c, weekXp: weekXpById.get(c.id) ?? 0 }))
    .sort((a, b) => b.weekXp - a.weekXp);
  const courseWeekXp = ranking.reduce((a, r) => a + r.weekXp, 0);
  const goal = course?.weekly_goal_xp ?? null;
  const goalMet = goal != null && courseWeekXp >= goal;
  const medals = ["🥇", "🥈", "🥉"];

  // RÉCORDS DE BATTLE de la semana: mejor puntaje de cada compañero → top 3 a superar.
  const bestBattleById = new Map<string, number>();
  for (const r of weekRows ?? []) {
    if (r.lesson_type !== "battle" || r.score_pct == null) continue;
    const cur = bestBattleById.get(r.kid_id) ?? -1;
    if (r.score_pct > cur) bestBattleById.set(r.kid_id, r.score_pct);
  }
  const nameById = new Map((classmates ?? []).map((c) => [c.id, { name: c.name, emoji: c.emoji }]));
  const battleRecords = Array.from(bestBattleById.entries())
    .map(([id, score]) => ({ id, score: Math.round(score), ...(nameById.get(id) ?? { name: "Alumno", emoji: "👤" }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const myBattleBest = bestBattleById.has(kid.id) ? Math.round(bestBattleById.get(kid.id)!) : null;

  // ⚔️ Desafíos DIRECTOS recibidos de compañeros (pendientes, no vencidos).
  // La tabla es solo-servidor; el target ya está validado como kid del usuario.
  let incomingChallenges: Array<{ id: string; challenge_id: string; challenger_name: string; challenger_score: number }> = [];
  try {
    const svc = createServiceClient();
    const { data } = await svc
      .from("course_challenge_targets")
      .select("id, challenge_id, challenger_name, challenger_score")
      .eq("target_kid_id", kid.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(10);
    incomingChallenges = data ?? [];
  } catch { /* migración 0019 pendiente → sin desafíos */ }

  const tools = enabledToolsFor(course?.enabled_modes as string[] | null);
  const lessonTool = tools.find((t) => t.key === "lesson");
  const otherTools = tools.filter((t) => t.key !== "lesson");

  // Actividades que etiquetan su XP con el mundo del colegio (cuentan para la
  // racha, la liga y la misión) y, cuando aplica, usan el tema del curso en su
  // contenido (v3: escritura/habla). Las demás guardan en su mundo propio.
  const TAGS_SCHOOL_WORLD = new Set([
    "/lesson", "/battle", "/flashcards", "/sentence-builder", "/story-fill",
    "/pronunciation", "/listen-id", "/memory-match", "/minimal-pairs", "/shadow-speaking",
    "/conversation", "/speaking-journal", "/translate-inverse", "/describe-scene",
  ]);
  const withKid = (route: string) =>
    TAGS_SCHOOL_WORLD.has(route)
      ? `${route}?kid=${kid.id}&world=${SCHOOL_WORLD_KEY}`
      : `${route}?kid=${kid.id}`;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">
          ← Worlds
        </Link>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-neon-red/15 text-neon-red border border-neon-red/30">
              🔥 Racha colegio: {streak}
            </span>
          )}
          <Avatar src={kid.avatar_url} emoji={kid.emoji} name={kid.name} ringColor={kid.color_hex} size="sm" />
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-3xl mx-auto relative z-10">
        {/* Encabezado del mundo */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-1">{SCHOOL_WORLD.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-1">{SCHOOL_WORLD.name}</h1>
          <p className="text-sm text-ink-dim">
            {course?.name ? `Curso ${course.name} · ` : ""}{SCHOOL_WORLD.tagline}
          </p>
        </div>

        {/* Lumi entrega el mensaje del profesor (y celebra si la misión se logró) */}
        <div className="flex flex-col items-center mb-6">
          <LumiCharacter mood={goalMet ? "celebrate" : "greet"} size={120} />
          <GlassCard strong className="mt-3 px-5 py-4 max-w-md text-center border border-neon-purple/40">
            {goalMet ? (
              <>
                <div className="text-[11px] font-bold uppercase tracking-widest text-neon-green mb-1">
                  🎉 ¡MISIÓN DEL CURSO CUMPLIDA!
                </div>
                <p className="text-sm">
                  ¡Lo lograron! El curso juntó <b>{courseWeekXp} XP</b> esta semana. ¡Estoy orgullosa de ustedes!
                </p>
              </>
            ) : course?.world_message ? (
              <>
                <div className="text-[11px] font-bold uppercase tracking-widest text-neon-purple mb-1">
                  💬 Tu profesor dice…
                </div>
                <p className="text-sm">“{course.world_message}”</p>
              </>
            ) : (
              <p className="text-sm text-ink-dim">{SCHOOL_WORLD.intro}</p>
            )}
          </GlassCard>
        </div>

        {/* MISIÓN GRUPAL — meta semanal de XP del curso completo */}
        {goal != null && (
          <GlassCard className={`p-4 mb-6 border ${goalMet ? "border-neon-green/60" : "border-neon-green/30"}`}>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-sm font-extrabold">🚀 Misión del curso</span>
              <span className={`text-xs font-bold ${goalMet ? "text-neon-green" : "text-ink-dim"}`}>
                {courseWeekXp} / {goal} XP esta semana
              </span>
            </div>
            <ProgressBar value={Math.min(100, (courseWeekXp / goal) * 100)} variant="neon-cyan" />
            <p className="text-[11px] text-ink-dim mt-1.5">
              {goalMet
                ? "¡Meta cumplida! Todo XP extra sigue sumando para la liga. 💪"
                : "Cada XP que gana CUALQUIER compañero en este mundo suma a la meta del curso."}
            </p>
          </GlassCard>
        )}

        {/* ⚔️ Desafíos directos recibidos de compañeros del curso */}
        {incomingChallenges.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-dim mb-3">
              ⚔️ Te retaron tus compañeros
            </h2>
            <div className="space-y-2">
              {incomingChallenges.map((c) => (
                <Link key={c.id} href={`/reto/${c.challenge_id}/jugar?kid=${kid.id}`} prefetch={false}>
                  <GlassCard className="p-4 flex items-center gap-3 border border-neon-red/40 hover:border-neon-red transition-colors mb-2">
                    <span className="text-2xl">⚔️</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{c.challenger_name} te retó</div>
                      <div className="text-xs text-ink-dim">
                        Sacó {c.challenger_score}% — ¿lo superas con las mismas palabras?
                      </div>
                    </div>
                    <span className="text-xs text-neon-red font-bold">Jugar →</span>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Lección del curso — la herramienta central */}
        {lessonTool && (
          <Link href={withKid("/lesson")}>
            <GlassCard strong glowColor="purple" className="p-5 mb-6 border-2 border-neon-purple/50 hover:border-neon-purple transition-colors">
              <div className="flex items-center gap-4">
                <div className="text-4xl">📖</div>
                <div className="flex-1">
                  <h2 className="font-extrabold">Lección del curso</h2>
                  <p className="text-xs text-ink-dim">
                    {course?.current_theme
                      ? `Tema: ${course.current_theme}`
                      : "Lección personalizada con lo que tu curso está viendo"}
                  </p>
                </div>
                <NeonButton size="sm" variant="primary">Empezar</NeonButton>
              </div>
            </GlassCard>
          </Link>
        )}

        {/* Evaluaciones de entrenamiento */}
        {(evaluations ?? []).length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-dim mb-3">
              📋 Entrena para tus evaluaciones
            </h2>
            <div className="space-y-2">
              {(evaluations ?? []).map((ev) => (
                <Link key={ev.id} href={`/lesson?kid=${kid.id}&world=${SCHOOL_WORLD_KEY}&eval=${ev.id}`}>
                  <GlassCard className="p-4 flex items-center gap-3 hover:border-neon-green/50 border border-white/10 transition-colors mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className="font-bold text-sm flex-1">{ev.title}</span>
                    <span className="text-xs text-neon-green font-bold">Entrenar →</span>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* LIGA DEL CURSO — ranking semanal entre compañeros */}
        {ranking.length > 1 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-dim mb-3">
              🏆 Liga del curso (esta semana)
            </h2>
            <GlassCard className="p-4">
              <div className="space-y-2">
                {ranking.slice(0, 30).map((r, i) => {
                  const isMe = r.id === kid.id;
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 text-sm rounded-lg px-2 py-1.5 ${
                        isMe ? "bg-neon-cyan/10 border border-neon-cyan/40" : ""
                      }`}
                    >
                      <span className="w-7 text-center font-extrabold">
                        {medals[i] ?? `${i + 1}º`}
                      </span>
                      <span className="text-lg">{r.emoji ?? "👤"}</span>
                      <span className={`flex-1 font-bold ${isMe ? "text-neon-cyan" : ""}`}>
                        {r.name}{isMe ? " (tú)" : ""}
                      </span>
                      <span className="font-extrabold" style={{ color: r.color_hex }}>
                        {r.weekXp} XP
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-ink-dim mt-3">
                Cuenta el XP ganado en este mundo desde el lunes. ¡La liga parte de cero cada semana!
              </p>
            </GlassCard>
          </section>
        )}

        {/* RÉCORDS DE BATTLE — el desafío directo entre compañeros */}
        {tools.some((t) => t.key === "battle") && ranking.length > 1 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-dim mb-3">
              ⚔️ Récords de Battle (esta semana)
            </h2>
            <GlassCard className="p-4 border border-neon-red/30">
              {battleRecords.length === 0 && (
                <p className="text-sm text-ink-dim mb-1">
                  Nadie ha puesto un récord esta semana. <b className="text-neon-red">¡Sé el primero!</b>
                </p>
              )}
              <div className="space-y-2">
                {battleRecords.map((r, i) => {
                  const isMe = r.id === kid.id;
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 text-sm rounded-lg px-2 py-1.5 ${
                        isMe ? "bg-neon-cyan/10 border border-neon-cyan/40" : ""
                      }`}
                    >
                      <span className="w-7 text-center font-extrabold">{medals[i] ?? `${i + 1}º`}</span>
                      <span className="text-lg">{r.emoji ?? "👤"}</span>
                      <span className={`flex-1 font-bold ${isMe ? "text-neon-cyan" : ""}`}>
                        {r.name}{isMe ? " (tú)" : ""}
                      </span>
                      <span className="font-extrabold text-neon-red">{r.score}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[11px] text-ink-dim">
                  {myBattleBest != null
                    ? `Tu mejor puntaje: ${myBattleBest}%.`
                    : "Aún no juegas Battle esta semana."}{" "}
                  ¿Puedes superar el récord? 💪
                </p>
                <Link href={`/battle?kid=${kid.id}&world=${SCHOOL_WORLD_KEY}`}>
                  <NeonButton size="sm" variant="primary">⚔️ ¡A batallar!</NeonButton>
                </Link>
              </div>
            </GlassCard>
          </section>
        )}

        {/* Herramientas activadas por el profesor */}
        {otherTools.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-dim mb-3">
              🧰 Herramientas de tu curso
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {otherTools.map((t) => (
                <Link key={t.key} href={withKid(t.route)}>
                  <GlassCard className="p-4 text-center h-full hover:scale-[1.03] transition-transform">
                    <div className="text-3xl mb-1.5">{t.emoji}</div>
                    <div className="font-bold text-sm mb-0.5">{t.name}</div>
                    <div className="text-[11px] text-ink-dim">{t.short}</div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="text-center text-[11px] text-ink-dim mt-8">
          🔥 La racha del colegio cuenta los días seguidos con 100+ XP ganados en este mundo.
        </p>
      </main>
    </>
  );
}
