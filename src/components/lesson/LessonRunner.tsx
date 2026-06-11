"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import type { LessonPayload } from "@/lib/groq/lesson";
import { LessonMarkdown } from "./LessonMarkdown";
import { LumiCharacter } from "@/components/coach/LumiCharacter";

interface KidMini {
  id: string;
  name: string;
  emoji: string;
  color_hex: string;
  total_xp: number;
  cefr_level: string;
}

type Phase = "loading" | "ready" | "quiz" | "results" | "error";

export function LessonRunner({
  kid,
  worldKey,
  schoolTopic,
  unitId,
  evalId,
}: {
  kid: KidMini;
  worldKey: string;
  schoolTopic?: string;
  unitId?: string;
  /** Evaluación de entrenamiento del mundo del colegio. */
  evalId?: string;
}) {
  const router = useRouter();
  const isSchool = worldKey === "school" && !!schoolTopic;
  const isSendero = !!unitId;
  const [phase, setPhase] = useState<Phase>("loading");
  const [lesson, setLesson] = useState<LessonPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mcAnswers, setMcAnswers] = useState<Record<number, string>>({});
  const [fitbAnswers, setFitbAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{
    correct: number; total: number; xp: number; xpMax: number; scorePct: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [startedAt] = useState(Date.now());

  // Generate the lesson on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/lessons/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kidId: kid.id,
            worldKey,
            // Modo "Tema del Colegio": el tema escrito/hablado dirige la lección.
            ...(isSchool ? { topicOverride: schoolTopic, schoolMode: true } : {}),
            // Sendero: lección de la unidad específica del currículo.
            ...(unitId ? { unitId } : {}),
            // Mundo del colegio: evaluación cargada por el profesor.
            ...(evalId ? { evaluationId: evalId } : {}),
          }),
        });
        if (cancelled) return;
        if (res.status === 402) {
          setError("Tu prueba terminó. Suscríbete para seguir.");
          setPhase("error");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "No pude generar la lección.");
          setPhase("error");
          return;
        }
        const data = await res.json();
        setLesson(data.lesson);
        setPhase("ready");
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          setPhase("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [kid.id, worldKey, schoolTopic, isSchool, unitId, evalId]);

  async function handleGenerateAudio() {
    if (!lesson) return;
    try {
      const res = await fetch("/api/audio/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lesson.lesson.slice(0, 3500), kidId: kid.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? "TTS falló");
        return;
      }
      const buf = await res.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
      setAudioUrl(url);
    } catch (e) {
      alert(String(e));
    }
  }

  async function handleSubmitQuiz() {
    if (!lesson) return;
    setSaving(true);
    try {
      // 1. Evaluate
      const evalRes = await fetch("/api/quiz/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mc: lesson.mc, fitb: lesson.fitb,
          mcAnswers: Object.fromEntries(Object.entries(mcAnswers).map(([k, v]) => [k, v])),
          fitbAnswers: Object.fromEntries(Object.entries(fitbAnswers).map(([k, v]) => [k, v])),
        }),
      });
      const evalData = await evalRes.json();

      // 2. Save XP
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id,
          lessonType: "lesson",
          worldKey,
          topic: lesson.academic_topic,
          skill: "grammar",
          scorePct: evalData.scorePct * 100,
          xpGained: evalData.xp,
          attempts: 1,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
          // Vincula la sesión a la evaluación del profesor (informe pre-prueba).
          ...(evalId ? { rawPayload: { evaluationId: evalId } } : {}),
        }),
      });

      setResult({
        correct: evalData.correct,
        total: evalData.total,
        xp: evalData.xp,
        xpMax: evalData.xpMax,
        scorePct: evalData.scorePct,
      });
      setPhase("results");
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (phase === "loading") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 relative z-10">
        <GlassCard strong className="p-8 text-center">
          <div className="text-4xl mb-3 animate-pulse">{isSchool ? "🎒" : "🧬"}</div>
          <h2 className="font-bold text-lg mb-1">Generando tu lección…</h2>
          <p className="text-sm text-ink-dim">
            {isSchool
              ? `Armándola sobre: ${schoolTopic}`
              : "Tejiéndola con tu mundo y tu familia"}
          </p>
        </GlassCard>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 relative z-10">
        <GlassCard strong className="p-8 text-center max-w-md">
          <div className="text-4xl mb-3">😢</div>
          <h2 className="font-bold text-lg mb-2">Ups</h2>
          <p className="text-sm text-ink-dim mb-4">{error}</p>
          <Link href="/profiles">
            <NeonButton variant="ghost-cyan">Volver</NeonButton>
          </Link>
        </GlassCard>
      </main>
    );
  }

  if (phase === "results" && result) {
    const pct = Math.round(result.scorePct * 100);
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <GlassCard strong glowColor={pct >= 80 ? "green" : pct >= 60 ? "cyan" : "red"} className="p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <LumiCharacter mood={pct >= 60 ? "celebrate" : "encourage"} size={156} />
          </div>
          <h2 className="text-2xl font-extrabold mb-1">
            {pct >= 80 ? "¡Excelente!" : pct >= 60 ? "¡Bien hecho!" : "Sigue practicando"}
          </h2>
          <p className="text-sm text-ink-dim mb-6">
            {result.correct} / {result.total} correctas
          </p>
          <div className="text-4xl font-extrabold text-neon-green mb-1">+{result.xp} XP</div>
          <div className="text-xs text-ink-dim mb-6">de {result.xpMax} máximo</div>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1">
              <NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton>
            </Link>
            <Link
              href={
                isSendero
                  ? `/sendero?kid=${kid.id}`
                  : isSchool
                  ? `/school?kid=${kid.id}`
                  : `/lesson?kid=${kid.id}&world=${worldKey}`
              }
              className="flex-1"
            >
              <NeonButton variant="primary" className="w-full">
                {isSendero ? "Ver Sendero" : isSchool ? "Otro tema" : "Otra lección"}
              </NeonButton>
            </Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  if (!lesson) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="flex items-center gap-1 text-sm font-bold text-neon-cyan">
          ← Worlds
        </Link>
        <div className="text-xs font-bold px-3 py-1 rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40">
          {phase === "quiz" ? "QUIZ" : "LESSON"}
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto relative z-10">
        {phase === "ready" && (
          <>
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-1">
                {lesson.academic_topic}
              </div>
              <h1 className="text-3xl font-extrabold mb-1">{lesson.title}</h1>
            </div>

            {/* Audio player */}
            <GlassCard className="p-4 mb-5 border border-neon-cyan/30">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-neon-cyan flex-shrink-0">
                  <span className="text-surface text-lg">🔊</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">Escuchar la lección</div>
                  <p className="text-xs text-ink-dim">Sigue el texto mientras escuchas.</p>
                </div>
              </div>
              {audioUrl ? (
                <audio src={audioUrl} controls className="w-full" autoPlay />
              ) : (
                <NeonButton variant="ghost-cyan" onClick={handleGenerateAudio} className="w-full">
                  ▶ Generar audio
                </NeonButton>
              )}
            </GlassCard>

            <GlassCard strong className="p-5 mb-5 border-l-[3px] border-l-neon-cyan">
              <LessonMarkdown>{lesson.lesson}</LessonMarkdown>
            </GlassCard>

            <NeonButton variant="primary" onClick={() => setPhase("quiz")} className="w-full" size="lg">
              ▶ Empezar quiz
            </NeonButton>
          </>
        )}

        {phase === "quiz" && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold">Quiz · {lesson.title}</h2>

            {lesson.mc.map((q, i) => (
              <GlassCard key={`mc-${i}`} className="p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-2">
                  Pregunta {i + 1}
                </div>
                <div className="font-bold mb-3">{q.q}</div>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      mcAnswers[i] === opt
                        ? "border-neon-cyan bg-neon-cyan/10"
                        : "border-white/10 hover:border-white/30"
                    }`}>
                      <input
                        type="radio"
                        name={`mc-${i}`}
                        value={opt}
                        checked={mcAnswers[i] === opt}
                        onChange={() => setMcAnswers({ ...mcAnswers, [i]: opt })}
                        className="hidden"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </GlassCard>
            ))}

            {lesson.fitb.map((q, i) => (
              <GlassCard key={`fitb-${i}`} className="p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-neon-purple mb-2">
                  Completa {i + 1}
                </div>
                <div className="font-bold mb-1">{q.sentence}</div>
                <div className="text-xs text-ink-dim italic mb-3">💡 {q.hint}</div>
                <input
                  type="text"
                  value={fitbAnswers[i] ?? ""}
                  onChange={(e) => setFitbAnswers({ ...fitbAnswers, [i]: e.target.value })}
                  placeholder="palabra que falta…"
                  className="w-full px-3 py-2 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors"
                />
              </GlassCard>
            ))}

            <NeonButton
              variant="primary"
              onClick={handleSubmitQuiz}
              loading={saving}
              className="w-full"
              size="lg"
            >
              Enviar respuestas
            </NeonButton>
          </div>
        )}
      </main>
    </>
  );
}
