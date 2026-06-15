"use client";

import { LumiCelebration } from "@/components/coach/LumiCelebration";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { EvalResult, type ProductionEvalLite } from "@/components/production/EvalResult";
import type { TranslateItem } from "@/lib/groq/writing-prompts";

export function TranslateInverseRunner({ kid, worldKey }: { kid: { id: string; name: string; color_hex: string }; worldKey?: string }) {
  const [phase, setPhase] = useState<"loading" | "play" | "scoring" | "review" | "done" | "error">("loading");
  const [items, setItems] = useState<TranslateItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [currentEval, setCurrentEval] = useState<ProductionEvalLite | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/translate-inverse/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, count: 5, world: worldKey }),
      });
      if (cancelled) return;
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error ?? "Falló"); setPhase("error"); return; }
      const data = await r.json();
      setItems(data.items);
      setPhase("play");
    })();
    return () => { cancelled = true; };
  }, [kid.id]);

  async function submit() {
    if (!draft.trim()) return;
    setPhase("scoring");
    try {
      const r = await fetch("/api/translate-inverse/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, sourceEs: items[idx].es, userEn: draft }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Falló");
      setCurrentEval(data.evaluation);
      const avg = (data.evaluation.fluency_score + data.evaluation.vocab_score + data.evaluation.grammar_score) / 3;
      setScores((s) => [...s, avg]);
      setPhase("review");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setPhase("error"); }
  }

  async function next() {
    if (idx + 1 >= items.length) {
      const avg = scores.reduce((a, x) => a + x, 0) / Math.max(1, scores.length);
      const xp = avg >= 80 ? 45 : avg >= 60 ? 30 : avg >= 40 ? 15 : 5;
      try {
        await fetch("/api/xp/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kidId: kid.id, lessonType: "translate_inverse", worldKey: worldKey ?? "writing",
            topic: "Translate ES→EN", skill: "writing", scorePct: avg, xpGained: xp,
            attempts: 1, durationSeconds: Math.round((Date.now() - startedAt) / 1000),
          }),
        });
      } catch {}
      setPhase("done");
    } else {
      setIdx(idx + 1);
      setDraft("");
      setCurrentEval(null);
      setPhase("play");
    }
  }

  if (phase === "loading") return <Center><div className="text-4xl mb-3 animate-pulse">🔁</div><p>Cargando oraciones…</p></Center>;
  if (phase === "error") return <Center><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Center>;
  if (phase === "scoring") return <Center><div className="text-4xl mb-3 animate-pulse">📝</div><p>Revisando tu traducción…</p></Center>;

  if (phase === "done") {
    const avg = Math.round(scores.reduce((a, x) => a + x, 0) / scores.length);
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor={avg >= 70 ? "green" : "cyan"} className="p-8 max-w-md w-full text-center">
          <LumiCelebration score={avg} size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">Promedio: {avg}%</h2>
          <p className="text-sm text-ink-dim mb-6">{items.length} oraciones traducidas</p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
            <Link href={`/translate-inverse?kid=${kid.id}`} className="flex-1"><NeonButton variant="primary" className="w-full">Otra ronda</NeonButton></Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  const current = items[idx];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold">🔁 {idx + 1}/{items.length}</div>
      </header>
      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto relative z-10">
        {phase === "play" ? (
          <>
            <GlassCard strong glowColor="purple" className="p-6 mb-4 text-center">
              <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">Traduce al inglés</div>
              <p className="text-xl font-extrabold">{current.es}</p>
            </GlassCard>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your English translation…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none resize-none mb-4"
            />
            <NeonButton variant="primary" onClick={submit} disabled={!draft.trim()} className="w-full" size="lg">
              Evaluar
            </NeonButton>
          </>
        ) : currentEval ? (
          <>
            <div className="mb-4 text-center">
              <div className="text-xs text-ink-dim mb-1">Original</div>
              <p className="text-sm italic">{current.es}</p>
            </div>
            <EvalResult evaluation={currentEval} userOutput={draft} showOriginal />
            <NeonButton variant="primary" onClick={next} className="w-full mt-6" size="lg">
              {idx + 1 >= items.length ? "Terminar" : "Siguiente"}
            </NeonButton>
          </>
        ) : null}
      </main>
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh flex items-center justify-center px-5"><GlassCard strong className="p-8 text-center max-w-md">{children}</GlassCard></main>;
}
