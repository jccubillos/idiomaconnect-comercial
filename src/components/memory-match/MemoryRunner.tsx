"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { LumiCelebration } from "@/components/coach/LumiCelebration";
import { LumiCharacter } from "@/components/coach/LumiCharacter";

interface Card {
  id: number;
  pairId: number;
  text: string;
  lang: "en" | "es";
  matched: boolean;
  flipped: boolean;
}

/** Máximo de jugadas equivocadas antes de invitar a reintentar (amable con niños). */
const MAX_ERRORS = 5;

function shuffle<T>(a: T[]) {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

type Phase = "loading" | "memorize" | "play" | "done" | "failed" | "error";

export function MemoryRunner({ kid, worldKey }: { kid: { id: string; name: string; color_hex: string }; worldKey?: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/listening/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, mode: "memory_match" }),
      });
      if (cancelled) return;
      if (!r.ok) { const j = await r.json().catch(() => ({})); setApiError(j.error ?? "Falló"); setPhase("error"); return; }
      const data = await r.json();
      const pairs: { word_en: string; word_es: string }[] = data.data.pairs;
      const initial: Card[] = [];
      pairs.forEach((p, i) => {
        initial.push({ id: i * 2, pairId: i, text: p.word_en, lang: "en", matched: false, flipped: false });
        initial.push({ id: i * 2 + 1, pairId: i, text: p.word_es, lang: "es", matched: false, flipped: false });
      });
      // Fase de memorización: arranca con TODAS las cartas a la vista.
      setCards(shuffle(initial));
      setPhase("memorize");
    })();
    return () => { cancelled = true; };
  }, [kid.id]);

  const totalPairs = cards.length / 2;
  const allMatched = useMemo(() => cards.length > 0 && cards.every((c) => c.matched), [cards]);

  useEffect(() => {
    if (allMatched && phase === "play") finish();
  }, [allMatched, phase]);

  /** Oculta las cartas y empieza el reto de memoria. */
  function start() {
    setCards((cs) => cs.map((c) => ({ ...c, flipped: false, matched: false })));
    setFlipped([]);
    setMoves(0);
    setErrors(0);
    setStartedAt(Date.now());
    setPhase("play");
  }

  /** Reintentar tras agotar los errores: mismas palabras, nuevas posiciones. */
  function retry() {
    setCards((cs) => shuffle(cs.map((c) => ({ ...c, flipped: false, matched: false }))));
    setFlipped([]);
    setMoves(0);
    setErrors(0);
    setPhase("memorize");
  }

  function flip(id: number) {
    if (phase !== "play") return;
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
          setErrors((e) => {
            const ne = e + 1;
            if (ne >= MAX_ERRORS) setPhase("failed");
            return ne;
          });
        }
        setFlipped([]);
      }, match ? 400 : 900);
    }
  }

  async function finish() {
    // Score = 100 menos penalización por cada error cometido.
    const pct = Math.max(20, 100 - errors * 16);
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
  if (phase === "error") return <Center><p className="text-neon-red mb-4">{apiError}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Center>;

  if (phase === "done") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor="green" className="p-8 max-w-md w-full text-center">
          <LumiCelebration size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">¡Encontraste todas las parejas! 🎉</h2>
          <p className="text-sm text-ink-dim mb-6">
            {totalPairs} pares · {errors} {errors === 1 ? "error" : "errores"}
          </p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
            <Link href={`/memory-match?kid=${kid.id}`} className="flex-1"><NeonButton variant="primary" className="w-full">Otra ronda</NeonButton></Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  if (phase === "failed") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong className="p-8 max-w-md w-full text-center border border-neon-purple/40">
          <LumiCharacter mood="encourage" size={150} className="mx-auto mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">¡Casi lo logras, {kid.name}!</h2>
          <p className="text-sm text-ink-dim mb-6">
            Equivocarse es parte de aprender 💪 Respira y vuelve a intentarlo: esta vez vas a
            recordar mejor dónde está cada pareja.
          </p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
            <NeonButton variant="primary" className="flex-1 w-full" onClick={retry}>Reintentar</NeonButton>
          </div>
        </GlassCard>
      </main>
    );
  }

  // phase === "memorize" | "play"
  const memorizing = phase === "memorize";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold flex items-center gap-3">
          {!memorizing && <span>🎴 {moves} jugadas</span>}
          {!memorizing && (
            <span className={errors >= MAX_ERRORS - 1 ? "text-neon-red" : "text-ink-dim"}>
              ❌ {errors}/{MAX_ERRORS}
            </span>
          )}
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-md mx-auto">
        {memorizing ? (
          <GlassCard strong className="p-4 mb-5 border border-neon-cyan/30">
            <div className="flex items-center gap-3">
              <LumiCharacter mood="greet" size={96} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-1">Lumi</div>
                <p className="text-sm leading-snug">
                  ¡Hola, {kid.name}! 🎴 Cada palabra en inglés tiene su pareja en español.
                  Memoriza dónde está cada una. Al tocar <b>Iniciar</b>, las cartas se darán
                  vuelta y deberás encontrar las parejas. ¡Solo puedes equivocarte {MAX_ERRORS} veces!
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <p className="text-center text-sm text-ink-dim mb-4">Encuentra las {totalPairs} parejas 🔎</p>
        )}

        <div className="grid grid-cols-4 gap-2">
          {cards.map((c) => {
            const reveal = memorizing || c.matched || c.flipped;
            return (
              <button
                key={c.id}
                onClick={() => flip(c.id)}
                disabled={memorizing || c.matched || c.flipped}
                className={`aspect-square rounded-xl text-xs font-bold flex items-center justify-center text-center px-1 transition-all ${
                  c.matched ? "bg-neon-green/20 border-2 border-neon-green/60 text-neon-green opacity-60"
                  : reveal ? c.lang === "en"
                    ? "bg-neon-cyan/20 border-2 border-neon-cyan/60 text-neon-cyan"
                    : "bg-neon-purple/20 border-2 border-neon-purple/60 text-neon-purple"
                  : "bg-surface-mid border-2 border-white/10 hover:border-neon-cyan/40 text-ink-dim"
                }`}
              >
                {reveal ? c.text : "?"}
              </button>
            );
          })}
        </div>

        {memorizing && (
          <div className="mt-6 text-center">
            <NeonButton variant="primary" size="lg" onClick={start}>
              Iniciar actividad
            </NeonButton>
          </div>
        )}
      </main>
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh flex items-center justify-center px-5"><GlassCard strong className="p-8 text-center max-w-md">{children}</GlassCard></main>;
}
