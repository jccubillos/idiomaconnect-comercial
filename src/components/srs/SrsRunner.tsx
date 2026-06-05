"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

interface SrsCardRow {
  id: string;
  word_en: string;
  translation_es: string | null;
  example_sentence: string | null;
  interval_days: number;
  ease_factor: number;
  repetition: number;
  due_at: string;
}

export function SrsRunner({ kid }: { kid: { id: string; name: string; color_hex: string } }) {
  const [phase, setPhase] = useState<"loading" | "review" | "done" | "empty" | "error">("loading");
  const [cards, setCards] = useState<SrsCardRow[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scored, setScored] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/srs/due?kidId=${kid.id}`);
      if (cancelled) return;
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Falló"); setPhase("error"); return;
      }
      const data = await res.json();
      if (!data.cards.length) { setPhase("empty"); return; }
      setCards(data.cards);
      setPhase("review");
    })();
    return () => { cancelled = true; };
  }, [kid.id]);

  async function review(quality: number) {
    const card = cards[idx];
    try {
      await fetch("/api/srs/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, quality }),
      });
    } catch {}
    setScored((s) => s + (quality >= 3 ? 1 : 0));
    setFlipped(false);
    if (idx + 1 >= cards.length) finish();
    else setIdx(idx + 1);
  }

  async function finish() {
    const pct = cards.length ? (scored / cards.length) * 100 : 0;
    const xp = Math.min(40, cards.length * 3);
    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id,
          lessonType: "srs_review",
          worldKey: null,
          topic: "SRS Review",
          skill: "vocabulary",
          scorePct: pct,
          xpGained: xp,
          attempts: 1,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch {}
    setPhase("done");
  }

  if (phase === "loading") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5">
        <GlassCard strong className="p-8 text-center"><div className="text-4xl mb-3 animate-pulse">🧠</div><h2 className="font-bold">Cargando tu cola…</h2></GlassCard>
      </main>
    );
  }
  if (phase === "empty") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5">
        <GlassCard strong className="p-8 text-center max-w-md">
          <div className="text-5xl mb-3">🌅</div>
          <h2 className="text-xl font-extrabold mb-1">No hay nada para repasar</h2>
          <p className="text-sm text-ink-dim mb-6">
            Tu cola SRS está al día. Sigue agregando palabras desde las flashcards.
          </p>
          <Link href={`/flashcards?kid=${kid.id}`}>
            <NeonButton variant="primary">▶ Hacer flashcards</NeonButton>
          </Link>
        </GlassCard>
      </main>
    );
  }
  if (phase === "error") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5">
        <GlassCard strong className="p-8 text-center max-w-md">
          <p className="text-sm text-neon-red mb-4">{error}</p>
          <Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link>
        </GlassCard>
      </main>
    );
  }
  if (phase === "done") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor="green" className="p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-3">🧠</div>
          <h2 className="text-2xl font-extrabold mb-1">Repaso completo</h2>
          <p className="text-sm text-ink-dim mb-6">{cards.length} cards revisadas</p>
          <Link href={`/worlds?kid=${kid.id}`}>
            <NeonButton variant="primary" className="w-full">Volver a Worlds</NeonButton>
          </Link>
        </GlassCard>
      </main>
    );
  }

  const card = cards[idx];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold">SRS · {idx + 1} / {cards.length}</div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-md mx-auto">
        <button onClick={() => setFlipped((f) => !f)} className="w-full mb-6">
          <GlassCard strong glowColor={flipped ? "purple" : "cyan"} className="aspect-[3/4] flex flex-col items-center justify-center p-6 text-center">
            <div className="text-xs uppercase tracking-widest text-ink-dim mb-3">
              {flipped ? "Significado" : "¿Recuerdas?"}
            </div>
            <h2 className={`text-3xl md:text-4xl font-extrabold ${flipped ? "text-neon-purple text-glow-purple" : "text-neon-cyan text-glow-cyan"}`}>
              {flipped ? (card.translation_es ?? "—") : card.word_en}
            </h2>
            {flipped && card.example_sentence && (
              <p className="text-sm italic text-ink-dim mt-3">{card.example_sentence}</p>
            )}
            {!flipped && (
              <div className="text-xs text-ink-dim mt-4">Toca para revelar</div>
            )}
          </GlassCard>
        </button>

        {flipped && (
          <div className="grid grid-cols-4 gap-2 animate-slide-up">
            <button onClick={() => review(0)} className="py-3 rounded-xl bg-neon-red/20 border border-neon-red/40 text-neon-red font-bold text-xs">😩 No</button>
            <button onClick={() => review(2)} className="py-3 rounded-xl bg-neon-yellow/20 border border-neon-yellow/40 text-neon-yellow font-bold text-xs">😐 Difícil</button>
            <button onClick={() => review(4)} className="py-3 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan font-bold text-xs">😊 Bien</button>
            <button onClick={() => review(5)} className="py-3 rounded-xl bg-neon-green/20 border border-neon-green/40 text-neon-green font-bold text-xs">🚀 Fácil</button>
          </div>
        )}
      </main>
    </>
  );
}
