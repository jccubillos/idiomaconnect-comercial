"use client";

import { LumiCelebration } from "@/components/coach/LumiCelebration";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { PronunciationTarget } from "@/lib/groq/pronunciation-words";

interface KidMini {
  id: string;
  name: string;
  emoji: string;
  avatar_url: string | null;
  color_hex: string;
}

interface AttemptResult {
  transcript: string;
  score: number;
  feedback: "excellent" | "good" | "fair" | "poor";
  missingWords: string[];
}

export function PronunciationRunner({ kid, worldKey }: { kid: KidMini; worldKey: string }) {
  const [phase, setPhase] = useState<"loading" | "practice" | "done" | "error">("loading");
  const [words, setWords] = useState<PronunciationTarget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [recording, setRecording] = useState(false);
  const [scoring, setScoring] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/pronunciation/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, worldKey, count: 6 }),
      });
      if (cancelled) return;
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "No pude generar palabras");
        setPhase("error");
        return;
      }
      const data = await res.json();
      setWords(data.words);
      setPhase("practice");
    })();
    return () => { cancelled = true; };
  }, [kid.id, worldKey]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await submitAttempt(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (e) {
      alert("No pude acceder al micrófono: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function submitAttempt(blob: Blob) {
    if (!words[idx]) return;
    setScoring(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "rec.webm");
      fd.append("target", words[idx].word);
      fd.append("kidId", kid.id);
      const res = await fetch("/api/pronunciation/score", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Score failed");
      setResults((r) => [...r, data]);
    } catch (e) {
      alert(String(e));
    } finally {
      setScoring(false);
    }
  }

  function nextWord() {
    if (idx + 1 >= words.length) finish();
    else setIdx(idx + 1);
  }

  async function finish() {
    const avg = results.length ? results.reduce((acc, r) => acc + r.score, 0) / results.length : 0;
    const xp = avg >= 85 ? 45 : avg >= 70 ? 30 : avg >= 50 ? 15 : 5;
    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id,
          lessonType: "pronunciation",
          worldKey,
          topic: "Pronunciation",
          skill: "speaking",
          scorePct: avg,
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
      <main className="min-h-dvh flex items-center justify-center px-5 relative z-10">
        <GlassCard strong className="p-8 text-center">
          <div className="text-4xl mb-3 animate-pulse">🎙</div>
          <h2 className="font-bold text-lg mb-1">Calibrando el estudio…</h2>
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
          <Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link>
        </GlassCard>
      </main>
    );
  }

  if (phase === "done") {
    const avg = results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <GlassCard strong glowColor={avg >= 70 ? "green" : "red"} className="p-8 max-w-md w-full text-center">
          <LumiCelebration score={avg} size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">
            Score promedio: {avg}%
          </h2>
          <p className="text-sm text-ink-dim mb-6">{results.length} palabras practicadas</p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1">
              <NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton>
            </Link>
            <Link href={`/pronunciation?kid=${kid.id}&world=${worldKey}`} className="flex-1">
              <NeonButton variant="primary" className="w-full">Otra ronda</NeonButton>
            </Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  const current = words[idx];
  const currentResult = results[idx];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold text-neon-green">🎙 Pronunciation</div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto relative z-10">
        <div className="text-center text-xs font-bold uppercase tracking-widest text-ink-dim mb-2">
          Palabra {idx + 1} de {words.length}
        </div>

        <GlassCard strong glowColor="green" className="p-8 text-center mb-6">
          <h2 className="text-5xl font-extrabold mb-2 text-glow-green text-neon-green">
            {current.word}
          </h2>
          {current.pronunciation && (
            <div className="text-base text-ink mb-1">{current.pronunciation}</div>
          )}
          {current.translation && (
            <div className="text-sm text-ink-dim italic">{current.translation}</div>
          )}
        </GlassCard>

        {currentResult ? (
          <GlassCard className="p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-widest text-ink-dim">
                Score
              </div>
              <div
                className={`text-2xl font-extrabold ${
                  currentResult.score >= 85
                    ? "text-neon-green"
                    : currentResult.score >= 70
                    ? "text-neon-cyan"
                    : currentResult.score >= 50
                    ? "text-neon-yellow"
                    : "text-neon-red"
                }`}
              >
                {currentResult.score}%
              </div>
            </div>
            <ProgressBar value={currentResult.score} variant="neon-green" />
            <div className="mt-3 text-sm">
              <div className="text-ink-dim text-xs uppercase tracking-wide mb-1">Te escuché decir:</div>
              <div className="italic">"{currentResult.transcript}"</div>
            </div>
            {currentResult.missingWords?.length > 0 && (
              <div className="mt-3 text-xs text-neon-red">
                Faltó: {currentResult.missingWords.join(", ")}
              </div>
            )}
            <NeonButton variant="primary" className="w-full mt-4" onClick={nextWord}>
              {idx + 1 >= words.length ? "Terminar" : "Siguiente"}
            </NeonButton>
          </GlassCard>
        ) : (
          <div className="text-center">
            {scoring ? (
              <div className="text-sm text-ink-dim animate-pulse">Analizando tu voz…</div>
            ) : recording ? (
              <NeonButton
                variant="primary"
                size="lg"
                onClick={stopRecording}
                className="px-8 animate-pulse"
              >
                ■ Detener
              </NeonButton>
            ) : (
              <NeonButton variant="ghost-green" size="lg" onClick={startRecording} className="px-8">
                ● Grabar
              </NeonButton>
            )}
            <div className="mt-3 text-xs text-ink-dim">
              Habla claro y a buen volumen. Una sola toma.
            </div>
          </div>
        )}
      </main>
    </>
  );
}
