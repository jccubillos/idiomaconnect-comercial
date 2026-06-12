import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { hasPlusAccess } from "@/lib/billing/access";

export const dynamic = "force-dynamic";

interface GlobalRow {
  kid_id: string;
  name: string;
  emoji: string;
  color_hex: string;
  cefr_level: string;
  week_xp: number;
}

export default async function ArenaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // family leaderboard from the SQL view
  const { data: rows = [] } = await supabase
    .from("leaderboard_weekly")
    .select("kid_id, name, emoji, color_hex, cefr_level, week_xp, total_xp")
    .order("week_xp", { ascending: false });

  const top = (rows ?? []).slice(0, 12);

  // 🏆 ARENA GLOBAL (Plus): liga nacional semanal entre TODOS los niños de la app.
  // Privacidad: solo nombre de pila/apodo, emoji y nivel — nada de la familia.
  const { data: fam } = await supabase
    .from("families")
    .select("plan, trial_ends_at")
    .eq("owner_user_id", user.id)
    .single();
  const plus = fam ? hasPlusAccess(fam) : false;

  let globalTop: GlobalRow[] = [];
  let globalCount = 0;
  let myGlobalRanks: Array<{ name: string; emoji: string; rank: number; week_xp: number }> = [];
  if (plus) {
    try {
      const svc = createServiceClient();
      const { data: g = [] } = await svc
        .from("leaderboard_weekly")
        .select("kid_id, name, emoji, color_hex, cefr_level, week_xp")
        .order("week_xp", { ascending: false })
        .limit(500);
      const all = (g ?? []) as GlobalRow[];
      globalCount = all.length;
      globalTop = all.slice(0, 15);
      const myKidIds = new Set((rows ?? []).map((r) => r.kid_id));
      myGlobalRanks = all
        .map((r, i) => ({ name: r.name, emoji: r.emoji, rank: i + 1, week_xp: r.week_xp }))
        .filter((_, i) => myKidIds.has(all[i].kid_id));
    } catch { /* sin service key: sección global se omite */ }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <h1 className="font-extrabold tracking-tight text-xl text-neon-redLight text-glow-red">⚔️ ARENA</h1>
        <div className="flex items-center gap-1 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span>online</span>
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-3xl mx-auto relative z-10">
        {/* Weekly challenge banner */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-2xl blur opacity-30 bg-gradient-to-br from-neon-purple to-neon-red" />
          <GlassCard strong className="relative p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-neon-purple mb-1">
                  ⚡ Weekly Challenge
                </div>
                <h3 className="font-bold text-lg">Vocab Sprint familiar</h3>
              </div>
              <div className="text-xs font-bold px-3 py-1 rounded-full bg-neon-green/15 text-neon-green">+100 XP</div>
            </div>
            <p className="text-xs text-ink-dim mb-3">
              Acumula más XP que tus hermanos/primos esta semana. El #1 se lleva un trofeo bonus.
            </p>
            <Link href="/profiles">
              <NeonButton variant="primary" className="w-full">Elegir perfil y batallar</NeonButton>
            </Link>
          </GlassCard>
        </div>

        {/* Battle quick access */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <GlassCard className="p-4">
            <span className="text-2xl mb-2 block text-neon-cyan">⚡</span>
            <h4 className="font-bold mb-1">Vocab Duel</h4>
            <p className="text-xs text-ink-dim mb-3">Combate 1v1 contra el Syntax Virus</p>
            <Link href="/profiles?next=battle"><NeonButton variant="ghost-cyan" size="sm" className="w-full !normal-case">Empezar</NeonButton></Link>
          </GlassCard>
          <GlassCard className="p-4">
            <span className="text-2xl mb-2 block text-neon-purple">🎙</span>
            <h4 className="font-bold mb-1">Pronunciation Trial</h4>
            <p className="text-xs text-ink-dim mb-3">6 palabras · score promedio</p>
            <Link href="/profiles?next=pronunciation"><NeonButton variant="ghost-purple" size="sm" className="w-full !normal-case">Empezar</NeonButton></Link>
          </GlassCard>
        </div>

        {/* 🏆 ARENA GLOBAL — liga nacional (exclusivo Plus) */}
        {plus ? (
          <GlassCard strong glowColor="purple" className="p-5 mb-6 border border-neon-purple/40">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-bold flex items-center gap-2">
                <span>🏆</span> Arena Global
              </h2>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-neon-purple/15 text-neon-purple">
                {globalCount} competidores
              </span>
            </div>
            <p className="text-xs text-ink-dim mb-4">
              La liga nacional de la semana: niños de toda la app compitiendo por XP. Se reinicia cada lunes.
            </p>

            {myGlobalRanks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {myGlobalRanks.map((m) => (
                  <span key={m.name} className="text-xs font-bold px-2.5 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40">
                    {m.emoji} {m.name}: #{m.rank} de {globalCount}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              {globalTop.map((row, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                return (
                  <div key={row.kid_id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02]">
                    <span className={`w-6 text-center font-bold ${i >= 3 ? "text-ink-dim text-sm" : "text-xl"}`}>{medal}</span>
                    <span className="text-lg">{row.emoji ?? "👤"}</span>
                    <span className="flex-1 font-bold text-sm">{row.name}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: `${row.color_hex}1a`, border: `1px solid ${row.color_hex}66`, color: row.color_hex }}
                    >
                      {row.cefr_level}
                    </span>
                    <span className="font-bold text-neon-green text-sm">{row.week_xp} XP</span>
                  </div>
                );
              })}
              {globalTop.length === 0 && (
                <p className="text-sm text-ink-dim text-center py-4">La liga parte esta semana. ¡Sé el primero del país! 🚀</p>
              )}
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="p-5 mb-6 border border-neon-purple/30 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🔒</span>
              <div className="flex-1">
                <h2 className="font-bold mb-1">🏆 Arena Global <span className="text-[10px] font-bold uppercase tracking-widest text-neon-purple bg-neon-purple/15 px-2 py-0.5 rounded-full ml-1">Plus</span></h2>
                <p className="text-xs text-ink-dim mb-3">
                  Compite cada semana con niños de todo Chile, ve tu posición nacional y corona a tu
                  familia en el ranking. Exclusivo del plan <b>Plus</b> y <b>Vitalicio</b>.
                </p>
                <Link href="/billing">
                  <NeonButton variant="primary" size="sm">Desbloquear con Plus</NeonButton>
                </Link>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Leaderboard */}
        <GlassCard strong className="p-5">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
            <h2 className="font-bold flex items-center gap-2">
              <span className="text-neon-purple">🏆</span> Hall of Fame
            </h2>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan">
              Esta semana
            </span>
          </div>

          {top.length === 0 ? (
            <p className="text-sm text-ink-dim text-center py-6">
              Aún no hay XP esta semana. ¡Sé el primero!
            </p>
          ) : (
            <div className="space-y-2">
              {top.map((row, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                const highlight =
                  i === 0
                    ? "bg-gradient-to-r from-neon-green/8 to-transparent border-neon-green/20"
                    : "bg-white/[0.02] border-transparent";
                return (
                  <div
                    key={row.kid_id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border ${highlight}`}
                  >
                    <span className={`w-6 text-center text-xl font-bold ${i >= 3 ? "text-ink-dim text-sm" : ""}`}>
                      {medal}
                    </span>
                    <Avatar emoji={row.emoji} name={row.name} ringColor={row.color_hex} size="sm" />
                    <div className="flex-1">
                      <div className="font-bold text-sm">{row.name}</div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${row.color_hex}1a`,
                          border: `1px solid ${row.color_hex}66`,
                          color: row.color_hex,
                        }}
                      >
                        {row.cefr_level}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-neon-green">{row.week_xp} XP</div>
                      <div className="text-xs text-ink-dim">{row.total_xp} total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </main>
      <BottomNav />
    </>
  );
}
