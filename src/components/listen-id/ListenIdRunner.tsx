"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { playTTS } from "@/lib/client/tts";
import type { ListenIdItem } from "@/lib/groq/listening";

function shuffle<T>(a: T[]) { const c = [...a]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; }

export function ListenIdRunner({ kid }: { kid: { id: string; name: string; color_hex: string } }) {
  const [phase, setPhase] = useState<"loading" | "play" | "done" | "error">("loading");
  const [items, setItems] = useState<ListenIdItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/listening/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, mode: "listen_id", count: 6 }),
      });
      if (cancelled) return;
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error ?? "Falló"); setPhase("error"); return; }
      const data = await r.json();
      setItems(data.data.items);
      setPhase("play");
    })();
    return () => { cancelled = true; };
  }, [kid.id]);

  const current = items[idx];
  const options = useMemo(() => current ? shuffle([current.correct_es, ...current.distractors_es]) : [], [current]);

  function pick(opt: string) {
    if (picked) return;
    setPicked(opt);
    if (opt === current.correct_es) setCorrect((c) => c + 1);
    setTimeout(() => {
      if (idx + 1 >= items.length) finish();
      else { setIdx(idx + 1); setPicked(null); }
    }, 1100);
  }

  async function finish() {
    const pct = items.length ? (correct / items.length) * 100 : 0;
    const xp = pct >= 80 ? 30 : pct >= 60 ? 18 : pct >= 40 ? 10 : 5;
    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id, lessonType: "listen_id", worldKey: "sound",
          topic: "Listen & ID", skill: "listening", scorePct: pct, xpGained: xp,
          attempts: 1, durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch {}
    setPhase("done");
  }

  if (phase === "loading") return <Center><div className="text-4xl mb-3 animate-pulse">👂</div><p>Cargando palabras…</p></Center>;
  if (phase === "error") return <Center><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Center>;

  if (phase === "done") {
    const pct = items.length ? Math.round((correct / items.length) * 100) : 0;
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor={pct >= 70 ? "green" : "cyan"} className="p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-3">👂</div>
          <h2 className="text-2xl font-extrabold mb-1">{correct} / {items.length}</h2>
          <p className="text-sm text-ink-dim mb-6">{pct}% de aciertos</p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
            <Link href={`/listen-id?kid=${kid.id}`} className="flex-1"><NeonButton variant="primary" className="w-full">Otra ronda</NeonButton></Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  if (!current) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold">👂 {idx + 1}/{items.length}</div>
      </header>
      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto">
        <div className="text-center mb-6">
          <NeonButton variant="ghost-green" size="lg" onClick={() => playTTS(current.word, kid.id)} className="px-8">
            🔊 Escuchar
          </NeonButton>
          <p className="text-xs text-ink-dim mt-2">¿Qué palabra es?</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const isCorrect = picked && opt === current.correct_es;
            const isWrong = picked === opt && opt !== current.correct_es;
            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                disabled={!!picked}
                className={`p-4 rounded-xl border text-sm font-bold transition-all ${
                  isCorrect ? "border-neon-green bg-neon-green/15 shadow-neon-green"
                  : isWrong ? "border-neon-red bg-neon-red/15"
                  : "border-white/15 bg-surface-mid hover:border-neon-cyan/40"
                }`}
              >
                {opt}
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
