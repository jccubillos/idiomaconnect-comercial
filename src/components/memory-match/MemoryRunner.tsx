"use client";

import { LumiCelebration } from "@/components/coach/LumiCelebration";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

interface Card {
  id: number;
  pairId: number;
  text: string;
  lang: "en" | "es";
  matched: boolean;
  flipped: boolean;
}

function shuffle<T>(a: T[]) {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

export function MemoryRunner({ kid, worldKey }: { kid: { id: string; name: string; color_hex: string }; worldKey?: string }) {
  const [phase, setPhase] = useState<"loading" | "play" | "done" | "error">("loading");
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/listening/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, mode: "memory_match" }),
      });
      if (cancelled) return;
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error ?? "Falló"); setPhase("error"); return; }
      const data = await r.json();
      const pairs: { word_en: string; word_es: string }[] = data.data.pairs;
      const initial: Card[] = [];
      pairs.forEach((p, i) => {
        initial.push({ id: i * 2, pairId: i, text: p.word_en, lang: "en", matched: false, flipped: false });
        initial.push({ id: i * 2 + 1, pairId: i, text: p.word_es, lang: "es", matched: false, flipped: false });
      });
      setCards(shuffle(initial));
      setPhase("play");
    })();
    return () => { cancelled = true; };
  }, [kid.id]);

  const allMatched = useMemo(() => cards.length > 0 && cards.every((c) => c.matched), [cards]);

  useEffect(() => {
    if (allMatched && phase === "play") finish();
  }, [allMatched, phase]);

  function flip(id: number) {
    if (flipped.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || card.flipped) return;
    const next = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    setCards(next);
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped.map((fid) => next.find((c) => c.id === fid)!);
      const match = a.pairId === b.pairId && a.lang !== b.lang;
      setTimeout(() => {
        if (match) {
          setCards((cs) => cs.map((c) => (c.id === a.id || c.id === b.id) ? { ...c, matched: true } : c));
        } else {
          setCards((cs) => cs.map((c) => (c.id === a.id || c.id === b.id) ? { ...c, flipped: false } : c));
        }
        setFlipped([]);
      }, match ? 400 : 900);
    }
  }

  async function finish() {
    const totalPairs = cards.length / 2;
    // Score = 100 - penalty per excess moves. Optimal = totalPairs moves.
    const pct = Math.max(0, 100 - Math.max(0, moves - totalPairs) * 8);
    const xp = pct >= 80 ? 30 : pct >= 60 ? 20 : 10;
    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id, lessonType: "memory_match", worldKey: worldKey ?? "vocab",
          topic: "Memory Match", skill: "vocabulary", scorePct: pct, xpGained: xp,
          attempts: 1, durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch {}
    setPhase("done");
  }

  if (phase === "loading") return <Center><div className="text-4xl mb-3 animate-pulse">🎴</div><p>Barajando…</p></Center>;
  if (phase === "error") return <Center><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Center>;

  if (phase === "done") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor="green" className="p-8 max-w-md w-full text-center">
          <LumiCelebration size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">¡Completado!</h2>
          <p className="text-sm text-ink-dim mb-6">
            {moves} jugadas · {cards.length / 2} pares
          </p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
            <Link href={`/memory-match?kid=${kid.id}`} className="flex-1"><NeonButton variant="primary" className="w-full">Otra ronda</NeonButton></Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold">🎴 {moves} jugadas</div>
      </header>
      <main className="pt-24 pb-32 px-5 max-w-md mx-auto">
        <div className="grid grid-cols-4 gap-2">
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => flip(c.id)}
              disabled={c.matched || c.flipped}
              className={`aspect-square rounded-xl text-xs font-bold flex items-center justify-center text-center px-1 transition-all ${
                c.matched ? "bg-neon-green/20 border-2 border-neon-green/60 text-neon-green opacity-60"
                : c.flipped ? c.lang === "en"
                  ? "bg-neon-cyan/20 border-2 border-neon-cyan/60 text-neon-cyan"
                  : "bg-neon-purple/20 border-2 border-neon-purple/60 text-neon-purple"
                : "bg-surface-mid border-2 border-white/10 hover:border-neon-cyan/40 text-ink-dim"
              }`}
            >
              {(c.matched || c.flipped) ? c.text : "?"}
            </button>
          ))}
        </div>
      </main>
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh flex items-center justify-center px-5"><GlassCard strong className="p-8 text-center max-w-md">{children}</GlassCard></main>;
}
