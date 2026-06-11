import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import { LumiCharacter } from "@/components/coach/LumiCharacter";
import { SCHOOL_WORLD, SCHOOL_WORLD_KEY, enabledToolsFor } from "@/lib/content/school-world";
import { computeSchoolStreak } from "@/lib/school/school-streak";

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
    .select("id, name, current_theme, world_message, enabled_modes")
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

  const tools = enabledToolsFor(course?.enabled_modes as string[] | null);
  const lessonTool = tools.find((t) => t.key === "lesson");
  const otherTools = tools.filter((t) => t.key !== "lesson");

  const withKid = (route: string) =>
    route === "/lesson"
      ? `/lesson?kid=${kid.id}&world=${SCHOOL_WORLD_KEY}`
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

        {/* Lumi entrega el mensaje del profesor */}
        <div className="flex flex-col items-center mb-8">
          <LumiCharacter mood="greet" size={120} />
          <GlassCard strong className="mt-3 px-5 py-4 max-w-md text-center border border-neon-purple/40">
            {course?.world_message ? (
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
