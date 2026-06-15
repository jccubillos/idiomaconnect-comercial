"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { EvalResult, type ProductionEvalLite } from "@/components/production/EvalResult";
import type { ScenePrompt } from "@/lib/groq/writing-prompts";

export function DescribeSceneRunner({ kid, worldKey }: { kid: { id: string; name: string; color_hex: string }; worldKey?: string }) {
  const [phase, setPhase] = useState<"loading" | "play" | "scoring" | "done" | "error">("loading");
  const [scene, setScene] = useState<ScenePrompt | null>(null);
  const [draft, setDraft] = useState("");
  const [evaluation, setEvaluation] = useState<ProductionEvalLite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/describe-scene/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, world: worldKey }),
      });
      if (cancelled) return;
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error ?? "Falló"); setPhase("error"); return; }
      const data = await r.json();
      setScene(data.scene);
      setPhase("play");
    })();
    return () => { cancelled = true; };
  }, [kid.id]);

  async function submit() {
    if (!draft.trim() || !scene) return;
    setPhase("scoring");
    try {
      const r = await fetch("/api/describe-scene/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, sceneEs: scene.scene_es, userEn: draft }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Falló");
      setEvaluation(data.evaluation);
      const avg = (data.evaluation.fluency_score + data.evaluation.vocab_score + data.evaluation.grammar_score) / 3;
      const xp = avg >= 80 ? 50 : avg >= 60 ? 35 : avg >= 40 ? 18 : 8;
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id, lessonType: "describe_scene", worldKey: worldKey ?? "writing",
          topic: "Describe Scene", skill: "writing", scorePct: avg, xpGained: xp,
          attempts: 1, durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
      setPhase("done");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setPhase("error"); }
  }

  if (phase === "loading") return <Center><div className="text-4xl mb-3 animate-pulse">🖼</div><p>Imaginando una escena…</p></Center>;
  if (phase === "error") return <Center><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Center>;
  if (phase === "scoring") return <Center><div className="text-4xl mb-3 animate-pulse">📝</div><p>Revisando tu descripción…</p></Center>;

  if (phase === "done" && evaluation) {
    return (
      <main className="min-h-dvh px-5 py-12 max-w-xl mx-auto relative z-10">
        <h2 className="text-xl font-extrabold mb-4">Describe la escena</h2>
        <EvalResult evaluation={evaluation} userOutput={draft} showOriginal />
        {scene?.scene_en_reference && (
          <GlassCard className="p-4 mt-4">
            <div className="text-xs uppercase tracking-widest text-ink-dim mb-1">Versión modelo</div>
            <p className="text-sm italic text-ink-dim">{scene.scene_en_reference}</p>
          </GlassCard>
        )}
        <div className="flex gap-3 mt-6">
          <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
          <Link href={`/describe-scene?kid=${kid.id}`} className="flex-1"><NeonButton variant="primary" className="w-full">Otra escena</NeonButton></Link>
        </div>
      </main>
    );
  }

  if (!scene) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold text-neon-pink">🖼 Describe Scene</div>
      </header>
      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto relative z-10">
        <GlassCard strong className="p-5 mb-4">
          <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">Escena</div>
          <p className="text-base leading-relaxed">{scene.scene_es}</p>
        </GlassCard>
        <GlassCard className="p-4 mb-4">
          <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">Palabras clave</div>
          <div className="flex flex-wrap gap-1.5">
            {scene.key_vocab.map((w) => (
              <span key={w} className="px-2 py-1 text-xs rounded-full bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan">{w}</span>
            ))}
          </div>
        </GlassCard>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Describe the scene in English…"
          rows={6}
          className="w-full px-4 py-3 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none resize-none mb-4"
        />
        <NeonButton variant="primary" onClick={submit} disabled={!draft.trim()} className="w-full" size="lg">
          Evaluar
        </NeonButton>
      </main>
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh flex items-center justify-center px-5"><GlassCard strong className="p-8 text-center max-w-md">{children}</GlassCard></main>;
}
