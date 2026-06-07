"use client";

import { LumiCelebration } from "@/components/coach/LumiCelebration";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { playTTS } from "@/lib/client/tts";
import type { MinimalPair } from "@/lib/groq/listening";

export function MinimalPairsRunner({ kid }: { kid: { id: string; name: string; color_hex: string } }) {
  const [phase, setPhase] = useState<"loading" | "play" | "done" | "error">("loading");
  const [pairs, setPairs] = useState<MinimalPair[]>([]);
  const [idx, setIdx] = useState(0);
  const [target, setTarget] = useState<"a" | "b">("a");
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/listening/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, mode: "minimal_pairs" }),
      });
      if (cancelled) return;
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error ?? "Falló"); setPhase("error"); return; }
      const data = await r.json();
      setPairs(data.data.pairs);
      setTarget(Math.random() < 0.5 ? "a" : "b");
      setPhase("play");
    })();
    return () => { cancelled = true; };
  }, [kid.id]);

  async function playTarget() {
    const word = target === "a" ? pairs[idx].a : pairs[idx].b;
    try { await playTTS(word, kid.id); }
    catch (e) { alert(String(e)); }
  }

  function pick(choice: "a" | "b") {
    if (picked) return;
    setPicked(choice);
    if (choice === target) setCorrectCount((c) => c + 1);
    setTimeout(() => {
      if (idx + 1 >= pairs.length) finish();
      else {
        setIdx(idx + 1);
        setTarget(Math.random() < 0.5 ? "a" : "b");
        setPicked(null);
      }
    }, 1200);
  }

  async function finish() {
    const pct = pairs.length ? (correctCount / pairs.length) * 100 : 0;
    const xp = pct >= 80 ? 30 : pct >= 60 ? 18 : pct >= 40 ? 10 : 5;
    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id, lessonType: "minimal_pairs", worldKey: "sound",
          topic: "Minimal pairs", skill: "listening", scorePct: pct, xpGained: xp,
          attempts: 1, durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch {}
    setPhase("done");
  }

  if (phase === "loading") return <Center><div className="text-4xl mb-3 animate-pulse">🎧</div><p>Calibrando el oído…</p></Center>;
  if (phase === "error") return <Center><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Center>;

  if (phase === "done") {
    const pct = pairs.length ? Math.round((correctCount / pairs.length) * 100) : 0;
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor={pct >= 70 ? "green" : "cyan"} className="p-8 max-w-md w-full text-center">
          <LumiCelebration score={pct} size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">{correctCount} / {pairs.length}</h2>
          <p className="text-sm text-ink-dim mb-6">{pct}% de aciertos</p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
            <Link href={`/minimal-pairs?kid=${kid.id}`} className="flex-1"><NeonButton variant="primary" className="w-full">Otra ronda</NeonButton></Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  const current = pairs[idx];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold">🎧 {idx + 1}/{pairs.length}</div>
      </header>
      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto">
        <GlassCard className="p-3 mb-4 text-center text-xs text-ink-dim">
          Diferencia: <b className="text-neon-cyan">{current.feature}</b>
        </GlassCard>
        <div className="text-center mb-6">
          <NeonButton variant="ghost-green" size="lg" onClick={playTarget} className="px-8">
            🔊 Escuchar
          </NeonButton>
          <p className="text-xs text-ink-dim mt-2">¿Cuál de las dos escuchaste?</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["a", "b"] as const).map((side) => {
            const word = side === "a" ? current.a : current.b;
            const meaning = side === "a" ? current.meaning_a : current.meaning_b;
            const correct = picked && side === target;
            const wrong = picked === side && side !== target;
            return (
              <button
                key={side}
                onClick={() => pick(side)}
                disabled={!!picked}
                className={`p-5 rounded-xl border transition-all ${
                  correct ? "border-neon-green bg-neon-green/15 shadow-neon-green"
                  : wrong ? "border-neon-red bg-neon-red/15"
                  : "border-white/15 bg-surface-mid hover:border-neon-cyan/40"
                }`}
              >
                <div className="text-2xl font-extrabold mb-1">{word}</div>
                <div className="text-xs text-ink-dim">{meaning}</div>
              </button>
            );
          })}
        </div>
      </main>
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh flex items-center justify-center px-5"><GlassCard strong className="p-8 text-center max-w-md">{children}</GlassCard></main>;
}
