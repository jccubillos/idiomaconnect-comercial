"use client";

import { LumiCelebration } from "@/components/coach/LumiCelebration";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import type { SBItem } from "@/lib/groq/sentences";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tokenize(s: string): string[] {
  // Keep punctuation attached to the word so kids learn capitalization & final dot.
  return s.trim().split(/\s+/);
}

export function SentenceBuilderRunner({
  kid,
  worldKey,
}: {
  kid: { id: string; name: string; color_hex: string };
  worldKey: string;
}) {
  const [phase, setPhase] = useState<"loading" | "play" | "done" | "error">("loading");
  const [items, setItems] = useState<SBItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [pool, setPool] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [reveal, setReveal] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/sentence-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, worldKey, count: 5 }),
      });
      if (cancelled) return;
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error ?? "Falló"); setPhase("error"); return;
      }
      const data = await r.json();
      setItems(data.items);
      const t = tokenize(data.items[0].sentence_en);
      setPool(shuffle(t));
      setPhase("play");
    })();
    return () => { cancelled = true; };
  }, [kid.id, worldKey]);

  const current = items[idx];
  const correctTokens = useMemo(() => current ? tokenize(current.sentence_en) : [], [current]);
  const isCorrect = picked.join(" ") === correctTokens.join(" ");

  function pickToken(t: string, i: number) {
    if (reveal) return;
    setPicked((p) => [...p, t]);
    setPool((pl) => {
      const copy = [...pl];
      copy.splice(i, 1);
      return copy;
    });
  }

  function unpickToken(i: number) {
    if (reveal) return;
    setPicked((p) => {
      const copy = [...p];
      const removed = copy.splice(i, 1)[0];
      setPool((pl) => [...pl, removed]);
      return copy;
    });
  }

  function check() {
    setReveal(true);
    if (isCorrect) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (idx + 1 >= items.length) finish();
    else {
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      setPicked([]);
      setPool(shuffle(tokenize(items[nextIdx].sentence_en)));
      setReveal(false);
    }
  }

  async function finish() {
    const pct = items.length ? (correctCount / items.length) * 100 : 0;
    const xp = pct >= 80 ? 35 : pct >= 60 ? 22 : pct >= 40 ? 12 : 5;
    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id,
          lessonType: "sentence_builder",
          worldKey,
          topic: "Sentence Builder",
          skill: "grammar",
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
    return <Centered><div className="text-4xl mb-3 animate-pulse">🧩</div><p>Cargando piezas…</p></Centered>;
  }
  if (phase === "error") {
    return <Centered><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Centered>;
  }
  if (phase === "done") {
    const pct = items.length ? Math.round((correctCount / items.length) * 100) : 0;
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor={pct >= 70 ? "green" : "cyan"} className="p-8 max-w-md w-full text-center">
          <LumiCelebration score={pct} size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">{correctCount} / {items.length} correctas</h2>
          <p className="text-sm text-ink-dim mb-6">{pct}% de aciertos</p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1">
              <NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton>
            </Link>
            <Link href={`/sentence-builder?kid=${kid.id}&world=${worldKey}`} className="flex-1">
              <NeonButton variant="primary" className="w-full">Otra ronda</NeonButton>
            </Link>
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
        <div className="text-xs font-bold">🧩 {idx + 1}/{items.length}</div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto">
        <GlassCard className="p-4 mb-4 text-center text-sm italic">
          Traduce y ordena: <b className="text-neon-cyan">"{current.translation_es}"</b>
        </GlassCard>

        {/* Picked tokens (the sentence in construction) */}
        <GlassCard strong className="p-4 mb-4 min-h-[80px]">
          <div className="flex flex-wrap gap-2">
            {picked.map((t, i) => (
              <button
                key={`${t}-${i}`}
                onClick={() => unpickToken(i)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                  reveal
                    ? isCorrect
                      ? "border-neon-green bg-neon-green/15 text-neon-green"
                      : t === correctTokens[i]
                      ? "border-neon-green bg-neon-green/15 text-neon-green"
                      : "border-neon-red bg-neon-red/15 text-neon-red"
                    : "border-neon-cyan/40 bg-neon-cyan/10 hover:bg-neon-cyan/20"
                }`}
              >
                {t}
              </button>
            ))}
            {picked.length === 0 && (
              <div className="text-xs text-ink-dim italic">Toca las piezas de abajo para construir la oración</div>
            )}
          </div>
        </GlassCard>

        {/* Token pool */}
        <div className="flex flex-wrap gap-2 mb-6">
          {pool.map((t, i) => (
            <button
              key={`${t}-pool-${i}`}
              onClick={() => pickToken(t, i)}
              disabled={reveal}
              className="px-3 py-1.5 rounded-lg border border-white/15 bg-surface-mid hover:border-neon-cyan/40 text-sm font-bold disabled:opacity-30"
            >
              {t}
            </button>
          ))}
        </div>

        {reveal && (
          <div className={`mb-4 text-sm ${isCorrect ? "text-neon-green" : "text-neon-red"}`}>
            {isCorrect
              ? `✔ ¡Perfecto!`
              : `✗ Correcto: "${current.sentence_en}"`}
          </div>
        )}

        {!reveal ? (
          <NeonButton variant="primary" onClick={check} disabled={!picked.length || pool.length > 0} className="w-full" size="lg">
            Comprobar
          </NeonButton>
        ) : (
          <NeonButton variant="ghost-cyan" onClick={next} className="w-full" size="lg">
            {idx + 1 >= items.length ? "Terminar" : "Siguiente"}
          </NeonButton>
        )}
      </main>
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5">
      <GlassCard strong className="p-8 text-center max-w-md">{children}</GlassCard>
    </main>
  );
}
