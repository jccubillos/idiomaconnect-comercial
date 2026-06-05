"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { EvalResult, type ProductionEvalLite } from "@/components/production/EvalResult";
import type { JournalPrompt } from "@/lib/groq/writing-prompts";

export function SpeakingJournalRunner({ kid }: { kid: { id: string; name: string; color_hex: string } }) {
  const [phase, setPhase] = useState<"loading" | "ready" | "recording" | "scoring" | "done" | "error">("loading");
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<ProductionEvalLite | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/speaking-journal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id }),
      });
      if (cancelled) return;
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error ?? "Falló"); setPhase("error"); return; }
      const data = await r.json();
      setPrompt(data.prompt);
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
        if (tickRef.current) clearInterval(tickRef.current);
        await submitAudio(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      mr.start();
      mediaRef.current = mr;
      setPhase("recording");
      setSecondsLeft(60);
      tickRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { mr.stop(); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      alert("Permiso de micrófono denegado.");
    }
  }

  function stopRecording() { mediaRef.current?.stop(); }

  async function submitAudio(blob: Blob) {
    setPhase("scoring");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "rec.webm");
      fd.append("kidId", kid.id);
      fd.append("promptEn", prompt?.prompt_en ?? "");
      const r = await fetch("/api/speaking-journal/evaluate", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Falló");
      setTranscript(data.transcript);
      setEvaluation(data.evaluation);

      const avg = (data.evaluation.fluency_score + data.evaluation.vocab_score + data.evaluation.grammar_score) / 3;
      const xp = avg >= 80 ? 50 : avg >= 60 ? 35 : avg >= 40 ? 20 : 8;
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id, lessonType: "speaking_journal", worldKey: "journal",
          topic: prompt?.prompt_en ?? "", skill: "speaking", scorePct: avg, xpGained: xp,
          attempts: 1, durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
      setPhase("done");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setPhase("error"); }
  }

  if (phase === "loading") return <Center><div className="text-4xl mb-3 animate-pulse">📔</div><p>Pensando un tema…</p></Center>;
  if (phase === "error") return <Center><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Center>;
  if (phase === "scoring") return <Center><div className="text-4xl mb-3 animate-pulse">🎙️</div><p>Escuchando y evaluando…</p></Center>;

  if (phase === "done" && evaluation) {
    return (
      <main className="min-h-dvh px-5 py-12 max-w-xl mx-auto relative z-10">
        <h2 className="text-xl font-extrabold mb-1">Diario hablado</h2>
        <p className="text-sm text-ink-dim mb-4">{prompt?.prompt_en}</p>
        <EvalResult evaluation={evaluation} userOutput={transcript} showOriginal />
        <div className="flex gap-3 mt-6">
          <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
          <Link href={`/speaking-journal?kid=${kid.id}`} className="flex-1"><NeonButton variant="primary" className="w-full">Otro tema</NeonButton></Link>
        </div>
      </main>
    );
  }

  if (!prompt) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold text-neon-cyan">📔 Diario hablado</div>
      </header>
      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto relative z-10">
        <GlassCard strong glowColor="cyan" className="p-6 mb-4 text-center">
          <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">El tema de hoy</div>
          <h2 className="text-xl font-extrabold mb-2 text-glow-cyan text-neon-cyan">{prompt.prompt_en}</h2>
          <p className="text-sm text-ink-dim italic">{prompt.prompt_es}</p>
        </GlassCard>
        <GlassCard className="p-4 mb-6">
          <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">💡 Ideas para empezar</div>
          <ul className="text-sm space-y-1">
            {prompt.bullet_ideas.map((b, i) => <li key={i}>• {b}</li>)}
          </ul>
        </GlassCard>
        <div className="text-center">
          {phase === "recording" ? (
            <>
              <NeonButton variant="primary" size="lg" onClick={stopRecording} className="animate-pulse px-8">
                ■ Detener ({secondsLeft}s)
              </NeonButton>
              <p className="text-xs text-ink-dim mt-3">Hablando en inglés…</p>
            </>
          ) : (
            <>
              <NeonButton variant="ghost-green" size="lg" onClick={startRecording} className="px-8">
                ● Grabar (hasta 60s)
              </NeonButton>
              <p className="text-xs text-ink-dim mt-3">Habla en inglés. No te preocupes por los errores.</p>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh flex items-center justify-center px-5"><GlassCard strong className="p-8 text-center max-w-md">{children}</GlassCard></main>;
}
