"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { LumiCelebration } from "@/components/coach/LumiCelebration";
import type { VisualCard } from "@/lib/content/visual-flashcards";

type AnswerState = "idle" | "correct" | "wrong";

interface Props {
  cards: VisualCard[];
  kid: { id: string; name: string; color_hex: string };
  worldKey: string;
}

export function VisualFlashcardsRunner({ cards, kid, worldKey }: Props) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [phase, setPhase] = useState<"play" | "done">("play");
  const [saving, setSaving] = useState(false);
  const [startedAt] = useState(Date.now());

  const card = cards[idx];
  const total = cards.length;

  async function handleAnswer(option: string) {
    if (answerState !== "idle") return;
    const isCorrect = option === card.correct;
    setSelectedOption(option);
    setAnswerState(isCorrect ? "correct" : "wrong");

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    // Avanza automáticamente tras 900ms
    setTimeout(async () => {
      if (idx + 1 >= total) {
        // Guardar XP
        setSaving(true);
        const pct = Math.round((newScore / total) * 100);
        const xp = pct >= 80 ? 35 : pct >= 60 ? 22 : pct >= 40 ? 12 : 6;
        try {
          await fetch("/api/xp/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidId: kid.id,
              lessonType: "flashcards",
              worldKey,
              topic: "Flashcards Visuales",
              skill: "vocabulary",
              scorePct: pct,
              xpGained: xp,
              attempts: 1,
              durationSeconds: Math.round((Date.now() - startedAt) / 1000),
            }),
          });
        } catch { /* non-fatal */ }
        setSaving(false);
        setPhase("done");
      } else {
        setIdx((i) => i + 1);
        setAnswerState("idle");
        setSelectedOption(null);
      }
    }, 900);
  }

  // ── PANTALLA FINAL ──────────────────────────────────────────────
  if (phase === "done") {
    const pct = Math.round((score / total) * 100);
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor="cyan" className="p-8 max-w-md w-full text-center">
          <LumiCelebration score={pct} size={160} className="mb-4" />
          <h2 className="text-2xl font-extrabold mb-1">
            {pct >= 80 ? "¡Excelente!" : pct >= 60 ? "¡Bien hecho!" : "¡Sigue practicando!"}
          </h2>
          <p className="text-sm text-ink-dim mb-1">
            Correctas: <span className="text-neon-green font-bold">{score}</span> de{" "}
            <span className="font-bold">{total}</span>
          </p>
          <p className="text-3xl font-extrabold text-neon-cyan mb-6">{pct}%</p>
          {saving && <p className="text-xs text-ink-dim mb-4 animate-pulse">Guardando XP…</p>}
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1">
              <NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton>
            </Link>
            <Link href={`/flashcards?kid=${kid.id}&world=${worldKey}`} className="flex-1">
              <NeonButton variant="primary" className="w-full">Otra ronda</NeonButton>
            </Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  // ── BARRA DE PROGRESO ────────────────────────────────────────────
  const progressPct = Math.round((idx / total) * 100);

  // ── COLORES SEGÚN ESTADO ─────────────────────────────────────────
  function optionStyle(opt: string) {
    if (answerState === "idle") return "border-white/20 bg-white/5 hover:border-neon-cyan hover:bg-neon-cyan/10";
    if (opt === card.correct) return "border-neon-green bg-neon-green/20 text-neon-green scale-105";
    if (opt === selectedOption && answerState === "wrong") return "border-neon-red bg-neon-red/20 text-neon-red";
    return "border-white/10 bg-white/5 opacity-40";
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex items-center gap-3">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan shrink-0">
          ← Worlds
        </Link>
        {/* Barra de progreso */}
        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-bold shrink-0 text-ink-dim">
          {idx + 1}/{total}
        </span>
      </header>

      <main className="pt-20 pb-32 px-5 max-w-md mx-auto">
        {/* Score en vivo */}
        <div className="text-center mb-2">
          <span className="text-xs text-ink-dim">
            ✅ <span className="text-neon-green font-bold">{score}</span> correctas
          </span>
        </div>

        {/* Imagen del objeto */}
        <div
          className={`relative mx-auto mb-6 rounded-3xl overflow-hidden border-2 transition-all duration-300 ${
            answerState === "correct"
              ? "border-neon-green shadow-[0_0_30px_#00ff8888]"
              : answerState === "wrong"
              ? "border-neon-red shadow-[0_0_30px_#ff003388]"
              : "border-neon-cyan/30"
          }`}
          style={{ width: 220, height: 220 }}
        >
          <Image
            src={`/objects/${card.object.key}.png`}
            alt={card.object.en}
            fill
            className="object-cover"
            priority
          />
          {/* Overlay de feedback */}
          {answerState === "correct" && (
            <div className="absolute inset-0 flex items-center justify-center bg-neon-green/20 text-5xl">
              ✅
            </div>
          )}
          {answerState === "wrong" && (
            <div className="absolute inset-0 flex items-center justify-center bg-neon-red/20 text-5xl">
              ❌
            </div>
          )}
        </div>

        {/* Pregunta */}
        <p className="text-center text-sm font-bold text-ink-dim uppercase tracking-widest mb-4">
          ¿Cómo se dice en inglés?
        </p>

        {/* Opciones */}
        <div className="grid grid-cols-2 gap-3">
          {card.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={answerState !== "idle"}
              className={`
                rounded-2xl border-2 p-4 text-center font-extrabold text-lg
                transition-all duration-200 cursor-pointer
                ${optionStyle(opt)}
              `}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Pronunciación (solo al responder correctamente) */}
        {answerState !== "idle" && (
          <div className="text-center mt-4 animate-slide-up">
            <p className="text-sm text-neon-cyan font-bold">{card.object.en}</p>
            <p className="text-xs text-ink-dim">{card.object.pron} — {card.object.es}</p>
          </div>
        )}
      </main>
    </>
  );
}
