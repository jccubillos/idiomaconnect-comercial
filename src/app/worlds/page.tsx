import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { UNIVERSAL_WORLDS, buildPersonalWorld, SCHOOL_WORLD } from "@/lib/content/worlds";
import { effectiveCefrInfo } from "@/lib/content/cefr";
import { familyAccess } from "@/lib/billing/access";
import { TrialBanner } from "@/components/billing/TrialBanner";
import { getCoachPlan } from "@/lib/coach/coach";
import { Lumi } from "@/components/coach/Lumi";
import { DailyMission } from "@/components/coach/DailyMission";
import { buildSendero, senderoSummary } from "@/lib/content/sendero";

interface PageProps {
  searchParams: { kid?: string };
}

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function WorldsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("*")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  // GATE de acceso: trial vencido → paywall. (Si la fila de familia no es visible,
  // es un profe/admin de colegio vía RLS de staff → plan school, acceso activo.)
  const { data: famRow } = await supabase
    .from("families")
    .select("plan, trial_ends_at")
    .eq("id", kid.family_id)
    .single();
  const access = famRow ? familyAccess(famRow) : { active: true, isTrial: false, expired: false, daysLeft: null };
  if (!access.active) redirect("/billing?expired=1");

  // Per-world progress: count completed sessions per world_key
  const { data: sessions = [] } = await supabase
    .from("lesson_sessions")
    .select("world_key, score_pct, lesson_type, skill, xp_gained, created_at, duration_seconds")
    .eq("kid_id", kid.id);

  const worldStats: Record<string, { sessions: number; avgScore: number }> = {};
  for (const s of sessions ?? []) {
    if (!s.world_key) continue;
    if (!worldStats[s.world_key]) worldStats[s.world_key] = { sessions: 0, avgScore: 0 };
    worldStats[s.world_key].sessions += 1;
    worldStats[s.world_key].avgScore += s.score_pct ?? 0;
  }
  for (const k of Object.keys(worldStats)) {
    worldStats[k].avgScore = worldStats[k].sessions
      ? worldStats[k].avgScore / worldStats[k].sessions
      : 0;
  }

  // Nivel EFECTIVO con doble exigencia (XP + unidades de gramática completadas),
  // con piso en el nivel ya alcanzado (respeta la ubicación por diagnóstico).
  const grammarCount = (sessions ?? []).filter((s) => s.world_key === "grammar").length;
  const cefr = effectiveCefrInfo(kid.total_xp, grammarCount, kid.cefr_level);

  // Coach Lumi: tarjetas SRS pendientes (señal para la Misión del Día) + plan del día.
  const { count: srsDueCount } = await supabase
    .from("srs_cards")
    .select("id", { count: "exact", head: true })
    .eq("kid_id", kid.id)
    .lte("due_at", new Date().toISOString());

  const coachPlan = getCoachPlan({
    kidId: kid.id,
    kidName: kid.name,
    cefrCode: cefr.code,
    sessions: (sessions ?? []).map((s) => ({
      lesson_type: s.lesson_type,
      world_key: s.world_key,
      skill: s.skill,
      score_pct: s.score_pct,
      xp_gained: s.xp_gained ?? 0,
      created_at: s.created_at,
    })),
    srsDueCount: srsDueCount ?? 0,
  });

  // Progreso del Sendero (usa el conteo de gramática ya calculado arriba).
  const senderoSum = senderoSummary(buildSendero(cefr.code, grammarCount));

  // Estado del diagnóstico: ¿nunca lo hizo? ¿toca re-medir el nivel?
  // Se invita a re-test tras >=30 días desde el último examen Y >=3 h de práctica.
  const DAY_MS = 86_400_000;
  const examDates = (sessions ?? [])
    .filter((s) => s.lesson_type === "exam" && s.created_at)
    .map((s) => new Date(s.created_at as string).getTime());
  const lastExamAt = examDates.length ? Math.max(...examDates) : null;
  const hasExam = lastExamAt !== null;
  const daysSinceExam = hasExam ? (Date.now() - lastExamAt) / DAY_MS : Infinity;
  const practiceSecondsSinceExam = (sessions ?? [])
    .filter((s) => s.lesson_type !== "exam")
    .filter((s) => !hasExam || (s.created_at && new Date(s.created_at).getTime() > (lastExamAt as number)))
    .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const retestDue = hasExam && daysSinceExam >= 30 && practiceSecondsSinceExam >= 3 * 3600;
  const daysAgo = Math.max(0, Math.floor(daysSinceExam));
  // Banner del diagnóstico — SIEMPRE accesible, con 3 estados según el progreso.
  const examBanner = retestDue
    ? {
        emoji: "🔔",
        title: "¡Es hora de volver a medir tu nivel!",
        sub: "Ya practicaste bastante — un nuevo test ajustará tus lecciones.",
        border: "border-neon-green/50 hover:border-neon-green",
        cta: "text-neon-green",
      }
    : !hasExam
    ? {
        emoji: "🎓",
        title: "Mide tu nivel de inglés",
        sub: "Test rápido (2-3 min) que ajusta las lecciones a tu nivel real",
        border: "border-neon-purple/30 hover:border-neon-purple/60",
        cta: "text-neon-purple",
      }
    : {
        emoji: "🎓",
        title: "Re-medir tu nivel",
        sub: `Último diagnóstico hace ${daysAgo} día${daysAgo === 1 ? "" : "s"} — puedes repetirlo cuando quieras`,
        border: "border-white/10 hover:border-neon-purple/40",
        cta: "text-neon-purple/80",
      };

  const personalWorld = buildPersonalWorld({
    kidName: kid.name,
    hobbies: kid.hobbies,
    color: kid.color_hex,
    emoji: kid.emoji,
  });

  function isUnlocked(minCefr?: string): boolean {
    if (!minCefr) return true;
    return CEFR_ORDER.indexOf(cefr.code) >= CEFR_ORDER.indexOf(minCefr);
  }

  return (
    <>
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href="/profiles" className="flex items-center gap-3 group">
          <Avatar
            src={kid.avatar_url}
            emoji={kid.emoji}
            name={kid.name}
            ringColor={kid.color_hex}
            size="sm"
          />
          <div>
            <div className="text-xs text-ink-dim">Welcome back,</div>
            <div className="font-bold text-sm group-hover:text-neon-cyan transition-colors">
              {kid.name}
            </div>
            {/* Insignia de nivel — reconocimiento permanente bajo el nombre */}
            <div
              className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
              style={{ background: `${kid.color_hex}22`, color: kid.color_hex, border: `1px solid ${kid.color_hex}55` }}
              title={`Nivel de inglés: ${cefr.code} ${cefr.name}`}
            >
              🎖️ {cefr.code} · {cefr.name}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
          <span className="text-neon-green">⚡</span>
          <span className="font-bold text-sm">{kid.total_xp} XP</span>
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-3xl mx-auto relative z-10">
        {access.isTrial && <TrialBanner daysLeft={access.daysLeft} expired={false} />}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold mb-1">Active Worlds</h2>
          <p className="text-sm text-ink-dim">
            Plot your course through the linguistic grid.
          </p>
        </div>

        {/* Coach Lumi — guía el siguiente paso (nube de diálogo) */}
        <Lumi mood={coachPlan.lumi.mood} message={coachPlan.lumi.message} cta={coachPlan.lumi.cta} />

        {/* Misión del día — 3 tareas variadas para evitar el grindeo */}
        <DailyMission
          tasks={coachPlan.mission.tasks}
          doneCount={coachPlan.mission.doneCount}
          total={coachPlan.mission.total}
        />

        {/* Sendero — el camino guiado ordenado (A1 → C1) */}
        <Link href={`/sendero?kid=${kid.id}`}>
          <GlassCard className="p-4 mb-6 border border-neon-purple/40 hover:border-neon-purple/70 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌌</span>
                <h3 className="font-bold text-sm">Tu Sendero</h3>
              </div>
              <span className="text-xs font-extrabold text-neon-purple">
                {senderoSum.completed}/{senderoSum.total}
              </span>
            </div>
            <div className="progress-track mb-2">
              <div
                className="progress-fill"
                style={{ width: `${senderoSum.pct}%`, background: "linear-gradient(90deg,#00eefc,#c464ff)" }}
              />
            </div>
            <div className="text-xs text-ink-dim truncate">
              {senderoSum.current
                ? `Siguiente: unidad ${senderoSum.current.number} · ${senderoSum.current.unit.title}`
                : "¡Camino completado! 🎉"}
            </div>
          </GlassCard>
        </Link>

        {/* Cápsula CEFR */}
        <GlassCard className="mb-6 p-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-ink-dim">
                Nivel actual
              </div>
              <div className="text-lg font-bold">
                {cefr.code} {cefr.name}
              </div>
              <div className="text-xs text-ink-dim">{cefr.tagline}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-neon-cyan">{kid.total_xp}</div>
              <div className="text-xs text-ink-dim">XP totales</div>
            </div>
          </div>
          <ProgressBar value={cefr.progress * 100} variant="neon-cyan" />
          <div className="text-xs text-ink-dim mt-1.5">{cefr.nextLabel}</div>
        </GlassCard>

        {/* Acceso al examen diagnóstico — siempre visible, mensaje adaptativo (3 estados) */}
        <Link href={`/exam?kid=${kid.id}`}>
          <GlassCard
            className={`mb-6 p-4 flex items-center justify-between border transition-colors ${examBanner.border}`}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">{examBanner.emoji}</div>
              <div>
                <div className="font-bold text-sm">{examBanner.title}</div>
                <div className="text-xs text-ink-dim">{examBanner.sub}</div>
              </div>
            </div>
            <span className={`text-sm font-bold whitespace-nowrap ${examBanner.cta}`}>Empezar →</span>
          </GlassCard>
        </Link>

        <div className="flex flex-col gap-4">
          {/* Personal world — always first, always unlocked */}
          <WorldCard
            worldKey="personal"
            kidId={kid.id}
            emoji={personalWorld.emoji}
            name={personalWorld.name}
            tagline={personalWorld.tagline}
            accent={personalWorld.accent}
            badge={{ text: "PERSONAL", color: "#39FF14" }}
            stats={worldStats["personal"]}
            unlocked={true}
          />

          {/* Tema del Colegio — función estrella de personalización (voz + texto).
              Tiene su propia pantalla de entrada (/school), no el hub de modos. */}
          <WorldCard
            worldKey={SCHOOL_WORLD.key}
            kidId={kid.id}
            emoji={SCHOOL_WORLD.emoji}
            name={SCHOOL_WORLD.name}
            tagline={SCHOOL_WORLD.tagline}
            accent={SCHOOL_WORLD.accent}
            badge={{ text: "PERSONALIZADO", color: SCHOOL_WORLD.accent }}
            stats={worldStats["school"]}
            unlocked={true}
            href={`/school?kid=${kid.id}`}
          />

          {/* Universal worlds */}
          {UNIVERSAL_WORLDS.map((w) => {
            const unlocked = isUnlocked(w.minCefr);
            const isCurrent = kid.current_world === w.key;
            return (
              <WorldCard
                key={w.key}
                worldKey={w.key}
                kidId={kid.id}
                emoji={w.emoji}
                name={w.name}
                tagline={w.tagline}
                accent={w.accent}
                badge={
                  isCurrent
                    ? { text: "CURRENT", color: w.accent }
                    : unlocked
                    ? null
                    : { text: `${w.minCefr} Req.`, color: "#a8aab0" }
                }
                stats={worldStats[w.key]}
                unlocked={unlocked}
              />
            );
          })}
        </div>
      </main>
      <BottomNav />
    </>
  );
}

interface WorldCardProps {
  worldKey: string;
  kidId: string;
  emoji: string;
  name: string;
  tagline: string;
  accent: string;
  badge: { text: string; color: string } | null;
  stats: { sessions: number; avgScore: number } | undefined;
  unlocked: boolean;
  /** Destino del card. Por defecto el hub de modos; el mundo "colegio" usa su propia pantalla. */
  href?: string;
}

function WorldCard({
  worldKey,
  kidId,
  emoji,
  name,
  tagline,
  accent,
  badge,
  stats,
  unlocked,
  href,
}: WorldCardProps) {
  const sessions = stats?.sessions ?? 0;
  const avgScore = stats?.avgScore ?? 0;
  const progressPct = Math.min(100, sessions * 10);

  const content = (
    <div className="relative">
      {unlocked && (
        <div
          className="absolute -inset-1 rounded-2xl blur opacity-30"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}55)` }}
        />
      )}
      <div
        className={`relative glass-strong rounded-2xl p-5 border ${
          unlocked ? "" : "world-locked"
        }`}
        style={{ borderColor: unlocked ? `${accent}80` : "rgba(255,255,255,0.08)" }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${accent}26`, border: `1px solid ${accent}66` }}
            >
              {emoji}
            </div>
            <div>
              <h3 className="font-bold text-xl">{name}</h3>
              <p className="text-sm" style={{ color: accent }}>{tagline}</p>
            </div>
          </div>
          {badge && (
            <div
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: `${badge.color}26`,
                color: badge.color,
                border: `1px solid ${badge.color}66`,
              }}
            >
              {badge.text}
            </div>
          )}
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-ink-dim">
              {sessions === 0
                ? "Sin práctica aún"
                : `${sessions} sesiones · promedio ${Math.round(avgScore)}%`}
            </span>
            <span style={{ color: accent }}>{progressPct}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${accent}, ${accent}99)`,
              }}
            />
          </div>
        </div>
        {unlocked && (
          <NeonButton
            variant={badge?.text === "CURRENT" ? "primary" : "ghost-cyan"}
            className="w-full"
          >
            {sessions > 0 ? "▶ Resume Quest" : "▶ Empezar"}
          </NeonButton>
        )}
      </div>
    </div>
  );

  if (!unlocked) return content;
  return (
    <Link href={href ?? `/play?kid=${kidId}&world=${worldKey}`}>
      {content}
    </Link>
  );
}
