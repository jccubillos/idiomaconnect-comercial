"use client";

import { LumiCelebration } from "@/components/coach/LumiCelebration";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import type { StoryFill } from "@/lib/groq/sentences";

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function StoryFillRunner({
  kid,
  worldKey,
}: {
  kid: { id: string; name: string; color_hex: string };
  worldKey: string;
}) {
  const [phase, setPhase] = useState<"loading" | "play" | "done" | "error">("loading");
  const [story, setStory] = useState<StoryFill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reveal, setReveal] = useState(false);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/story-fill/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, worldKey }),
      });
      if (cancelled) return;
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error ?? "Falló"); setPhase("error"); return;
      }
      const data = await r.json();
      setStory(data.story);
      setPhase("play");
    })();
    return () => { cancelled = true; };
  }, [kid.id, worldKey]);

  // Split the template into segments by [[N]] placeholders.
  const segments = useMemo(() => {
    if (!story) return [];
    const parts: Array<{ type: "text"; value: string } | { type: "blank"; idx: number }> = [];
    const re = /\[\[(\d+)\]\]/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(story.story_template)) !== null) {
      if (m.index > lastIndex) parts.push({ type: "text", value: story.story_template.slice(lastIndex, m.index) });
      parts.push({ type: "blank", idx: Number(m[1]) - 1 });
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < story.story_template.length) parts.push({ type: "text", value: story.story_template.slice(lastIndex) });
    return parts;
  }, [story]);

  if (phase === "loading") {
    return <Centered><div className="text-4xl mb-3 animate-pulse">📜</div><p>Escribiendo tu historia…</p></Centered>;
  }
  if (phase === "error") {
    return <Centered><p className="text-neon-red mb-4">{error}</p><Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link></Centered>;
  }
  if (phase === "done" && story) {
    const correct = story.blanks.filter((b, i) => normalize(answers[i] ?? "") === normalize(b.answer)).length;
    const pct = Math.round((correct / story.blanks.length) * 100);
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12">
        <GlassCard strong glowColor={pct >= 70 ? "green" : "cyan"} className="p-8 max-w-md w-full text-center">
          <LumiCelebration score={pct} size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">{correct} / {story.blanks.length} correctas</h2>
          <p className="text-sm text-ink-dim mb-6">{pct}% de aciertos</p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1"><NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton></Link>
            <Link href={`/story-fill?kid=${kid.id}&world=${worldKey}`} className="flex-1"><NeonButton variant="primary" className="w-full">Otra historia</NeonButton></Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  if (!story) return null;

  function check() { setReveal(true); }

  async function finish() {
    const correct = story!.blanks.filter((b, i) => normalize(answers[i] ?? "") === normalize(b.answer)).length;
    const pct = (correct / story!.blanks.length) * 100;
    const xp = pct >= 80 ? 35 : pct >= 60 ? 22 : pct >= 40 ? 12 : 5;
    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id,
          lessonType: "story_fill",
          worldKey,
          topic: story!.title,
          skill: "reading",
          scorePct: pct,
          xpGained: xp,
          attempts: 1,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch {}
    setPhase("done");
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
        <div className="text-xs font-bold">📜 {story.blanks.length} huecos</div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-4 text-center">{story.title}</h1>

        <GlassCard strong className="p-5 mb-4 leading-relaxed text-base">
          {segments.map((seg, i) =>
            seg.type === "text" ? (
              <span key={i}>{seg.value}</span>
            ) : (
              <span key={i} className="inline-block mx-1 align-baseline">
                <input
                  type="text"
                  value={answers[seg.idx] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [seg.idx]: e.target.value })}
                  disabled={reveal}
                  className={`px-2 py-1 rounded-md text-sm font-bold focus:outline-none w-28 text-center border ${
                    reveal
                      ? normalize(answers[seg.idx] ?? "") === normalize(story.blanks[seg.idx].answer)
                        ? "border-neon-green text-neon-green bg-neon-green/10"
                        : "border-neon-red text-neon-red bg-neon-red/10"
                      : "border-neon-cyan/40 text-neon-cyan bg-neon-cyan/10 focus:border-neon-cyan"
                  }`}
                />
                {reveal && normalize(answers[seg.idx] ?? "") !== normalize(story.blanks[seg.idx].answer) && (
                  <span className="ml-1 text-xs text-neon-green">→ {story.blanks[seg.idx].answer}</span>
                )}
              </span>
            ),
          )}
        </GlassCard>

        {/* Hints */}
        {!reveal && (
          <div className="text-xs text-ink-dim mb-4 space-y-1">
            {story.blanks.map((b, i) => b.hint && (
              <div key={i}>💡 #{i + 1}: {b.hint}</div>
            ))}
          </div>
        )}

        {!reveal ? (
          <NeonButton variant="primary" onClick={check} className="w-full" size="lg" disabled={Object.keys(answers).length < story.blanks.length}>
            Comprobar
          </NeonButton>
        ) : (
          <NeonButton variant="ghost-cyan" onClick={finish} className="w-full" size="lg">
            Terminar
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
