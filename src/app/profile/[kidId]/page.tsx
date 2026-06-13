import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { getCefrInfo } from "@/lib/content/cefr";
import { evaluateTrophies } from "@/lib/content/trophies";
import { computeStats, computeStreakDays, computeSkillBreakdown } from "@/lib/pedagogy/stats";

export default async function ProfileDetailPage({ params }: { params: { kidId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Filtro EXPLÍCITO por familia (defensa en profundidad sobre RLS): este perfil
  // SOLO puede verlo la familia dueña. Sin esto, una falla de RLS podría exponer
  // el perfil (y la personalización) de otra familia.
  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();
  if (!family) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("*")
    .eq("id", params.kidId)
    .eq("family_id", family.id)
    .single();
  if (!kid) redirect("/profiles");

  const { data: sessions = [] } = await supabase
    .from("lesson_sessions")
    .select("lesson_type, world_key, skill, score_pct, xp_gained, created_at")
    .eq("kid_id", kid.id);

  const stats = computeStats(sessions ?? []);
  const streak = computeStreakDays(sessions ?? []);
  const skills = computeSkillBreakdown(sessions ?? []);
  const trophies = evaluateTrophies(stats);
  const cefr = getCefrInfo(kid.total_xp);

  // Due SRS count (light query)
  const { count: dueCount } = await supabase
    .from("srs_cards")
    .select("id", { count: "exact", head: true })
    .eq("kid_id", kid.id)
    .lte("due_at", new Date().toISOString());

  const skillOrder = ["reading", "listening", "writing", "speaking", "vocabulary", "grammar"] as const;
  const skillVariant: Record<string, "reading" | "listening" | "writing" | "speaking" | "neon-cyan"> = {
    reading: "reading",
    listening: "listening",
    writing: "writing",
    speaking: "speaking",
    vocabulary: "neon-cyan",
    grammar: "neon-cyan",
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href="/profiles" className="text-sm font-bold text-neon-cyan">← Perfiles</Link>
        <div className="font-bold">Profile</div>
        <Link href={`/profile/${kid.id}/edit`} className="text-xs font-bold text-ink-dim hover:text-neon-cyan">Editar</Link>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto relative z-10">
        {/* Hero card */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-3xl blur opacity-30 bg-gradient-to-br from-neon-red to-neon-purple" />
          <GlassCard strong className="relative p-6 text-center rounded-3xl">
            <div className="mx-auto mb-3" style={{ width: "fit-content" }}>
              <Avatar
                src={kid.avatar_url}
                emoji={kid.emoji}
                name={kid.name}
                ringColor={kid.color_hex}
                size="xl"
              />
            </div>
            <h2 className="text-2xl font-extrabold mb-1">{kid.name}</h2>
            <p className="text-sm text-ink-dim mb-3">{kid.emoji}</p>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{
                background: `${cefr.code === "A1" ? "#00eefc" : "#c464ff"}1a`,
                border: `1px solid ${cefr.code === "A1" ? "#00eefc66" : "#c464ff66"}`,
              }}
            >
              <span className="text-base">🏅</span>
              <span className="text-xs font-bold tracking-widest text-neon-cyan">
                LEVEL {cefr.code} · {cefr.name.toUpperCase()}
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar value={cefr.progress * 100} variant="neon-cyan" />
              <div className="text-xs text-ink-dim mt-1">{cefr.nextLabel}</div>
            </div>
          </GlassCard>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard value={String(stats.totalXp)} label="XP Total" color="#ff4b4b" />
          <StatCard value={String(stats.totalSessions)} label="Lecciones" color="#39ff14" />
          <StatCard value={`${streak}🔥`} label="Días racha" color="#c464ff" />
        </div>

        {/* SRS due reminder */}
        {(dueCount ?? 0) > 0 && (
          <Link href={`/srs?kid=${kid.id}`}>
            <GlassCard glowColor="purple" className="p-4 mb-6 flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🧠</div>
                <div>
                  <div className="font-bold text-sm">Repaso pendiente</div>
                  <div className="text-xs text-ink-dim">{dueCount} cards listas para revisar</div>
                </div>
              </div>
              <span className="text-neon-purple text-xl">→</span>
            </GlassCard>
          </Link>
        )}

        {/* Skill analysis */}
        <GlassCard strong className="p-5 mb-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span className="text-neon-purple">📊</span> Skill Analysis
          </h3>
          <div className="space-y-4">
            {skillOrder.map((skill) => {
              const data = skills[skill];
              const pct = data?.avgScore ? data.avgScore * 100 : 0;
              return (
                <div key={skill}>
                  <div className="flex justify-between text-sm font-bold mb-1.5">
                    <span className="capitalize">{skill}</span>
                    <span className="text-ink-dim">
                      {data ? `${data.sessions} sesiones · ${Math.round(pct)}%` : "Sin práctica"}
                    </span>
                  </div>
                  <ProgressBar value={pct} variant={skillVariant[skill] ?? "neon-cyan"} />
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Trophies */}
        <GlassCard strong className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <span className="text-neon-green">🏆</span> Trofeos
            </h3>
            <span className="text-xs font-bold text-ink-dim">
              {trophies.filter((t) => t.earned).length} / {trophies.length}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {trophies.map((t) => (
              <div
                key={t.key}
                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center text-center p-2 transition-all ${
                  t.earned
                    ? "bg-neon-green/10 border-neon-green/40 shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                    : "bg-surface-mid/40 border-white/5 opacity-50"
                }`}
                title={t.desc}
              >
                <span className={`text-3xl mb-1 ${!t.earned ? "opacity-30" : ""}`}>{t.icon}</span>
                <div className="text-[10px] font-bold leading-tight">{t.name}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="mt-8 text-center">
          <Link href={`/worlds?kid=${kid.id}`}>
            <NeonButton variant="primary" size="lg">▶ Seguir aprendiendo</NeonButton>
          </Link>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <GlassCard className="text-center p-3">
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-xs text-ink-dim">{label}</div>
    </GlassCard>
  );
}
