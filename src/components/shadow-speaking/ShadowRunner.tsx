"use client";

import { LumiCelebration } from "@/components/coach/LumiCelebration";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { playTTS } from "@/lib/client/tts";
import type { ShadowPhrase } from "@/lib/groq/listening";

export function ShadowRunner({ kid, worldKey }: { kid: { id: string; name: string; color_hex: string }; worldKey?: string }) {
  const [phase, setPhase] = useState<"loading" | "ready" | "recording" | "scoring" | "done" | "error">("loading");
  const [phrases, setPhrases] = useState<ShadowPhrase[]>([]);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ score: number; transcript: string }[]>([]);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/listening/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, mode: "shadow" }),
      });
      if (cancelled) return;
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error ?? "Falló"); setPhase("error"); return; }
      const data = await r.json();
      setPhrases(data.data.phrases);
      setPhase("ready");
    })();
    return () => { cancelled = true; };
  }, [kid.id]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await submit(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      mr.start();
      mediaRef.current = mr;
      setPhase("recording");
    } catch { alert("Permiso de micrófono denegado."); }
  }

  function stop() { mediaRef.current?.stop(); }

  async function submit(blob: Blob) {
    setPhase("scoring");
    const fd = new FormData();
    fd.append("audio", blob, "rec.webm");
    fd.append("target", phrases[idx].phrase);
    fd.append("kidId", kid.id);
    try {
      const r = await fetch("/api/pronunciation/score", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Falló");
      const newResults = [...results, { score: data.score, transcript: data.transcript }];
      setResults(newResults);
      if (idx + 1 >= phrases.length) await finish(newResults);
      else { setIdx(idx + 1); setPhase("ready"); }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setPhase("error"); }
  }

  async function finish(rs: { score: number }[]) {
    const avg = rs.length ? rs.reduce((a, r) => a + r.score, 0) / rs.length : 0;
    const xp = avg >= 85 ? 40 : avg >= 70 ? 28 : avg >= 50 ? 15 : 5;
    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id, lessonType: "shadow_speaking", worldKey: worldKey ?? "sound",
          topic: "Shadow Speaking", skill: "speaking", scorePct: avg, xpGained: xp,
          attempts: 1, durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch {}
    setPhase("done");
  }

  if (phase === "loading") return <Center><div className="text-4xl mb-3 animate-pulse">🔊</div><p>Cargando frases…</p></Center>;
  if (phase === "error") return <Center><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Center>;
  if (phase === "scoring") return <Center><div className="text-4xl mb-3 animate-pulse">🎙</div><p>Comparando…</p></Center>;

  if (phase === "done") {
    const avg = results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor={avg >= 70 ? "green" : "red"} className="p-8 max-w-md w-full text-center">
          <LumiCelebration score={avg} size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">Promedio: {avg}%</h2>
          <p className="text-sm text-ink-dim mb-6">{phrases.length} frases practicadas</p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
            <Link href={`/shadow-speaking?kid=${kid.id}`} className="flex-1"><NeonButton variant="primary" className="w-full">Otra ronda</NeonButton></Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  const current = phrases[idx];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold">🔊 {idx + 1}/{phrases.length}</div>
      </header>
      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto">
        <ProgressBar value={(idx / phrases.length) * 100} variant="neon-green" className="mb-4" />
        <GlassCard strong glowColor="green" className="p-6 text-center mb-4">
          <h2 className="text-2xl font-extrabold text-glow-green text-neon-green mb-2">
            {current.phrase}
          </h2>
          {current.pronunciation && <div className="text-sm">{current.pronunciation}</div>}
          <div className="text-xs text-ink-dim italic mt-2">{current.translation}</div>
        </GlassCard>
        <div className="grid grid-cols-2 gap-3">
          <NeonButton variant="ghost-cyan" size="lg" onClick={() => playTTS(current.phrase, kid.id)} className="!normal-case">
            🔊 Escuchar
          </NeonButton>
          {phase === "recording" ? (
            <NeonButton variant="primary" size="lg" onClick={stop} className="animate-pulse !normal-case">■ Detener</NeonButton>
          ) : (
            <NeonButton variant="ghost-green" size="lg" onClick={startRecording} className="!normal-case">● Repetir</NeonButton>
          )}
        </div>
        <p className="text-xs text-ink-dim text-center mt-3">Escucha → repite → te damos un score</p>
      </main>
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh flex items-center justify-center px-5"><GlassCard strong className="p-8 text-center max-w-md">{children}</GlassCard></main>;
}
