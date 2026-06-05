import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { BottomNav } from "@/components/ui/BottomNav";
import { SCENARIOS } from "@/lib/content/scenarios";
import { ConversationRunner } from "@/components/conversation/ConversationRunner";
import { getCefrInfo } from "@/lib/content/cefr";

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function ConversationPage({ searchParams }: { searchParams: { kid?: string; scenario?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!searchParams.kid) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, total_xp")
    .eq("id", searchParams.kid)
    .single();
  if (!kid) redirect("/profiles");

  const cefr = getCefrInfo(kid.total_xp);

  // If a scenario is selected → run it. Otherwise show picker.
  if (searchParams.scenario) {
    return <ConversationRunner kid={kid} scenarioKey={searchParams.scenario} />;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold text-neon-purple">💬 Conversation</div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold mb-1">Elige un escenario</h1>
          <p className="text-sm text-ink-dim">Vas a hablar en inglés con la IA en una situación real.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIOS.map((s) => {
            const locked = CEFR_ORDER.indexOf(cefr.code) < CEFR_ORDER.indexOf(s.minCefr);
            return locked ? (
              <GlassCard key={s.key} className="p-4 opacity-50">
                <div className="text-3xl mb-2">{s.emoji}</div>
                <h3 className="font-bold mb-1">{s.name}</h3>
                <p className="text-xs text-ink-dim mb-2">{s.setting}</p>
                <div className="text-[10px] uppercase tracking-widest text-ink-dim">🔒 Req. {s.minCefr}</div>
              </GlassCard>
            ) : (
              <Link key={s.key} href={`/conversation?kid=${kid.id}&scenario=${s.key}`}>
                <GlassCard className="p-4 hover:scale-[1.02] transition-transform border border-white/10 hover:border-neon-purple/40">
                  <div className="text-3xl mb-2">{s.emoji}</div>
                  <h3 className="font-bold mb-1">{s.name}</h3>
                  <p className="text-xs text-ink-dim mb-2">{s.setting}</p>
                  <div className="text-[10px] uppercase tracking-widest text-ink-dim">{s.objectives.length} objetivos</div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
