"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { placeFromAnswers, type ExamQuestion } from "@/lib/groq/exam";

export function ExamRunner({
  kid,
  onboarding = false,
}: {
  kid: { id: string; name: string; color_hex: string; cefr_level: string };
  onboarding?: boolean;
}) {
  const [phase, setPhase] = useState<"intro" | "loading" | "play" | "done" | "error">("intro");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [placedLevel, setPlacedLevel] = useState<string | null>(null);

  async function start() {
    setPhase("loading");
    setStartedAt(Date.now());
    try {
      const r = await fetch("/api/exam/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error ?? "Falló"); setPhase("error"); return; }
      const data = await r.json();
      setQuestions(data.questions);
      setIdx(0);
      setAnswers({});
      setPhase("play");
    } catch (e) { setError(String(e)); setPhase("error"); }
  }

  async function pickAnswer(opt: string) {
    const newAnswers = { ...answers, [idx]: opt };
    setAnswers(newAnswers);
    if (idx + 1 >= questions.length) await finish(newAnswers);
    else setTimeout(() => setIdx(idx + 1), 300);
  }

  async function finish(finalAnswers: Record<number, string>) {
    const correct = questions.filter((q, i) => (finalAnswers[i] ?? "") === q.answer).length;
    const pct = (correct / questions.length) * 100;
    const xp = 30;
    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id, lessonType: "exam", worldKey: null,
          topic: "CEFR Diagnostic", skill: "grammar", scorePct: pct, xpGained: xp,
          attempts: 1, durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch {}

    // Aplica el nivel diagnosticado como punto de partida (piso, nunca baja).
    try {
      const { suggested } = placeFromAnswers(questions, finalAnswers);
      const r = await fetch("/api/exam/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, level: suggested }),
      });
      if (r.ok) {
        const j = await r.json();
        setPlacedLevel(j.cefr?.code ?? suggested);
      }
    } catch {}

    setPhase("done");
  }

  if (phase === "intro") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <GlassCard strong glowColor="purple" className="max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-extrabold mb-2">
            {onboarding ? `¡Hola! Conozcamos el inglés de ${kid.name}` : "Examen diagnóstico"}
          </h1>
          {onboarding ? (
            <p className="text-sm text-ink-dim mb-6">
              Antes de empezar, 15 preguntas cortas (2-3 min) para medir el nivel real
              de {kid.name} y <b className="text-neon-cyan">personalizar sus lecciones desde el día uno</b>.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-dim mb-2">
                15 preguntas adaptativas, cubriendo de A1 a C1.
              </p>
              <p className="text-sm text-ink-dim mb-6">
                Mediremos tu nivel real. Tu nivel actual: <b className="text-neon-cyan">{kid.cefr_level}</b>.
              </p>
            </>
          )}
          <NeonButton variant="primary" size="lg" onClick={start} className="w-full">
            {onboarding ? "Empezar diagnóstico" : "Empezar examen"}
          </NeonButton>
          <Link href={`/worlds?kid=${kid.id}`} className="block mt-4 text-xs text-ink-dim hover:text-neon-cyan">
            {onboarding ? "Saltar por ahora (lo puedes hacer luego)" : "← Volver"}
          </Link>
        </GlassCard>
      </main>
    );
  }
  if (phase === "loading") return <Center><div className="text-4xl mb-3 animate-pulse">📝</div><p>Preparando preguntas…</p></Center>;
  if (phase === "error") return <Center><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Center>;

  if (phase === "done") {
    const { suggested, perLevel } = placeFromAnswers(questions, answers);
    const correctTotal = questions.filter((q, i) => (answers[i] ?? "") === q.answer).length;
    return (
      <main className="min-h-dvh px-5 py-12 max-w-xl mx-auto relative z-10">
        <GlassCard strong glowColor="purple" className="p-8 text-center mb-4">
          <div className="text-5xl mb-3">🎓</div>
          <div className="text-xs uppercase tracking-widest text-ink-dim">Nivel sugerido</div>
          <div className="text-5xl font-extrabold text-neon-purple text-glow-purple my-2">{suggested}</div>
          <p className="text-sm text-ink-dim">{correctTotal} / {questions.length} correctas</p>
        </GlassCard>

        <GlassCard className="p-5 mb-4">
          <h3 className="font-bold text-sm uppercase tracking-widest text-ink-dim mb-3">Por nivel</h3>
          <div className="space-y-3">
            {Object.entries(perLevel).map(([lvl, v]) => {
              const pct = v.total ? (v.right / v.total) * 100 : 0;
              return (
                <div key={lvl}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{lvl}</span>
                    <span className="text-ink-dim">{v.right}/{v.total}</span>
                  </div>
                  <ProgressBar value={pct} variant="neon-purple" />
                </div>
              );
            })}
          </div>
        </GlassCard>

        {placedLevel ? (
          <GlassCard className="p-4 mb-4 text-sm border border-neon-green/30">
            <span className="text-neon-green font-bold">✓ Nivel aplicado.</span>{" "}
            <span className="text-ink-dim">
              Tus próximas lecciones se personalizarán para el nivel <b className="text-neon-cyan">{placedLevel}</b>,
              y se desbloquearon los mundos acordes. Tu nivel seguirá subiendo con la práctica diaria.
            </span>
          </GlassCard>
        ) : (
          <GlassCard className="p-4 mb-4 text-sm text-ink-dim">
            💡 El nivel se sugiere considerando que respondes ≥2/3 correctamente en ese nivel.
          </GlassCard>
        )}

        <Link href={`/worlds?kid=${kid.id}`}>
          <NeonButton variant="primary" className="w-full" size="lg">
            {onboarding ? "¡Empezar a aprender!" : "Volver a Worlds"}
          </NeonButton>
        </Link>
      </main>
    );
  }

  const current = questions[idx];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Salir</Link>
        <div className="text-xs font-bold">🎓 {idx + 1}/{questions.length}</div>
      </header>
      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto">
        <ProgressBar value={((idx + 1) / questions.length) * 100} variant="neon-purple" className="mb-4" />
        <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">
          Nivel: {current.level}
        </div>
        <GlassCard strong className="p-6 mb-4">
          <p className="text-lg font-bold">{current.q}</p>
        </GlassCard>
        <div className="space-y-2">
          {current.options.map((opt) => (
            <button
              key={opt}
              onClick={() => pickAnswer(opt)}
              disabled={!!answers[idx]}
              className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                answers[idx] === opt
                  ? opt === current.answer
                    ? "border-neon-green bg-neon-green/15"
                    : "border-neon-red bg-neon-red/15"
                  : "border-white/10 hover:border-neon-cyan/40"
              }`}
            >
              {opt}
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
