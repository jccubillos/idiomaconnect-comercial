import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { UNIVERSAL_WORLDS, buildPersonalWorld } from "@/lib/content/worlds";
import { getCefrInfo } from "@/lib/content/cefr";

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

  // Per-world progress: count completed sessions per world_key
  const { data: sessions = [] } = await supabase
    .from("lesson_sessions")
    .select("world_key, score_pct")
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

  const cefr = getCefrInfo(kid.total_xp);
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
              {kid.name} · {cefr.code}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
          <span className="text-neon-green">⚡</span>
          <span className="font-bold text-sm">{kid.total_xp} XP</span>
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold mb-1">Active Worlds</h2>
          <p className="text-sm text-ink-dim">
            Plot your course through the linguistic grid.
          </p>
        </div>

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

        {/* Acceso al examen diagnóstico — mide y ajusta el nivel real */}
        <Link href={`/exam?kid=${kid.id}`}>
          <GlassCard className="mb-6 p-4 flex items-center justify-between border border-neon-purple/30 hover:border-neon-purple/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎓</div>
              <div>
                <div className="font-bold text-sm">Mide tu nivel de inglés</div>
                <div className="text-xs text-ink-dim">
                  Test rápido (2-3 min) que ajusta las lecciones a tu nivel real
                </div>
              </div>
            </div>
            <span className="text-neon-purple text-sm font-bold whitespace-nowrap">Empezar →</span>
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
    <Link href={`/play?kid=${kidId}&world=${worldKey}`}>
      {content}
    </Link>
  );
}
