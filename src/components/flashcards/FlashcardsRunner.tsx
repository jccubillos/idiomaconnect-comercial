"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import type { Flashcard } from "@/lib/groq/flashcards";

export function FlashcardsRunner({
  kid,
  worldKey,
}: {
  kid: { id: string; name: string; color_hex: string };
  worldKey: string;
}) {
  const [phase, setPhase] = useState<"loading" | "study" | "done" | "error">("loading");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCards, setUnknownCards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, worldKey, count: 8 }),
      });
      if (cancelled) return;
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Falló"); setPhase("error"); return;
      }
      const data = await res.json();
      setCards(data.cards);
      setPhase("study");
    })();
    return () => { cancelled = true; };
  }, [kid.id, worldKey]);

  function answer(known: boolean) {
    const card = cards[idx];
    if (known) setKnownCount((k) => k + 1);
    else setUnknownCards((u) => [...u, card]);
    setFlipped(false);
    if (idx + 1 >= cards.length) finish(unknownCards.concat(known ? [] : [card]));
    else setIdx(idx + 1);
  }

  async function finish(toReview: Flashcard[]) {
    const pct = cards.length ? (knownCount / cards.length) * 100 : 0;
    const xp = pct >= 80 ? 30 : pct >= 50 ? 18 : 8;

    // Add unknowns to SRS
    if (toReview.length) {
      try {
        await fetch("/api/srs/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kidId: kid.id,
            cards: toReview.map((c) => ({
              word_en: c.word_en,
              translation_es: c.translation_es,
              example: c.example,
            })),
          }),
        });
      } catch {}
    }

    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id,
          lessonType: "flashcards",
          worldKey,
          topic: "Flashcards",
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
        <GlassCard strong className="p-8 text-center">
          <div className="text-4xl mb-3 animate-pulse">🃏</div>
          <h2 className="font-bold">Generando flashcards…</h2>
        </GlassCard>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5">
        <GlassCard strong className="p-8 text-center max-w-md">
          <div className="text-4xl mb-3">😢</div>
          <p className="text-sm text-ink-dim mb-4">{error}</p>
          <Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link>
        </GlassCard>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor="green" className="p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-3">🃏</div>
          <h2 className="text-2xl font-extrabold mb-1">¡Listo!</h2>
          <p className="text-sm text-ink-dim mb-4">
            Conocidas: <span className="text-neon-green font-bold">{knownCount}</span> /
            Repaso: <span className="text-neon-cyan font-bold">{unknownCards.length}</span>
          </p>
          <p className="text-xs text-ink-dim mb-6">
            Las que marcaste como "no sé" entran en tu repaso SRS.
          </p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1">
              <NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton>
            </Link>
            <Link href={`/srs?kid=${kid.id}`} className="flex-1">
              <NeonButton variant="primary" className="w-full">Repasar SRS</NeonButton>
            </Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  const card = cards[idx];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold">{idx + 1} / {cards.length}</div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-md mx-auto">
        <button onClick={() => setFlipped((f) => !f)} className="w-full perspective-[1200px] mb-6">
          <div
            className={`relative w-full aspect-[3/4] transition-transform duration-500 [transform-style:preserve-3d] ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            {/* Front */}
            <GlassCard
              strong
              glowColor="cyan"
              className="absolute inset-0 [backface-visibility:hidden] flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="text-xs uppercase tracking-widest text-ink-dim mb-3">Inglés</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-neon-cyan text-glow-cyan mb-2">
                {card.word_en}
              </h2>
              {card.pronunciation && (
                <div className="text-sm text-ink-dim">{card.pronunciation}</div>
              )}
              <div className="absolute bottom-3 left-0 right-0 text-xs text-ink-dim">
                Toca para ver traducción
              </div>
            </GlassCard>
            {/* Back */}
            <GlassCard
              strong
              glowColor="purple"
              className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="text-xs uppercase tracking-widest text-ink-dim mb-3">Español</div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-neon-purple text-glow-purple mb-3">
                {card.translation_es}
              </h2>
              {card.example && (
                <p className="text-sm italic text-ink-dim">{card.example}</p>
              )}
            </GlassCard>
          </div>
        </button>

        {flipped && (
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <NeonButton variant="ghost-cyan" onClick={() => answer(false)} size="lg" className="!normal-case">
              No la sabía
            </NeonButton>
            <NeonButton variant="primary" onClick={() => answer(true)} size="lg" className="!normal-case">
              ¡La sabía!
            </NeonButton>
          </div>
        )}
      </main>
    </>
  );
}
