"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getScenario } from "@/lib/content/scenarios";
import type { ConversationSummary } from "@/lib/groq/conversation";

interface Msg { role: "user" | "assistant"; content: string }

const MAX_TURNS = 14;

export function ConversationRunner({
  kid,
  scenarioKey,
}: {
  kid: { id: string; name: string; color_hex: string };
  scenarioKey: string;
}) {
  const scenario = getScenario(scenarioKey);
  const [history, setHistory] = useState<Msg[]>([
    scenario ? { role: "assistant", content: scenario.starterAI } : { role: "assistant", content: "..." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState<"chat" | "summary" | "error">("chat");
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, summary]);

  if (!scenario) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5">
        <GlassCard strong className="p-6 text-center"><p>Escenario no encontrado.</p></GlassCard>
      </main>
    );
  }

  const userTurnsDone = history.filter((m) => m.role === "user").length;

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const newHistory = [...history, { role: "user" as const, content: text }];
    setHistory(newHistory);

    try {
      const res = await fetch("/api/conversation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id,
          scenarioKey,
          history: newHistory.slice(-12),
          userMessage: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setHistory((h) => [...h, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    } finally {
      setSending(false);
    }
  }

  async function finish() {
    setSending(true);
    try {
      const res = await fetch("/api/conversation/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId: kid.id, scenarioKey, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setSummary(data.summary);
      setPhase("summary");

      // Save XP based on average score
      const avg = (data.summary.fluency_score + data.summary.vocab_score + data.summary.grammar_score) / 3;
      const xp = avg >= 80 ? 45 : avg >= 60 ? 30 : avg >= 40 ? 18 : 8;
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id,
          lessonType: "conversation",
          worldKey: "chat",
          topic: scenario?.name ?? null,
          skill: "speaking",
          scorePct: avg,
          xpGained: xp,
          attempts: 1,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    } finally {
      setSending(false);
    }
  }

  if (phase === "summary" && summary) {
    const avg = Math.round((summary.fluency_score + summary.vocab_score + summary.grammar_score) / 3);
    return (
      <main className="min-h-dvh px-5 py-12 max-w-xl mx-auto relative z-10">
        <GlassCard strong glowColor={avg >= 70 ? "green" : "cyan"} className="p-6 mb-4 text-center">
          <div className="text-5xl mb-3">{avg >= 85 ? "🏆" : avg >= 70 ? "💬" : "💪"}</div>
          <h2 className="text-2xl font-extrabold mb-1">Conversación terminada</h2>
          <p className="text-sm text-ink-dim mb-4">{scenario.emoji} {scenario.name}</p>
          <div className="text-4xl font-extrabold text-neon-green">{avg}</div>
          <div className="text-xs text-ink-dim">promedio general</div>
        </GlassCard>

        <GlassCard className="p-5 mb-4">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-widest text-ink-dim">Por habilidad</h3>
          <div className="space-y-3">
            <ScoreRow label="Fluency" value={summary.fluency_score} variant="speaking" />
            <ScoreRow label="Vocabulary" value={summary.vocab_score} variant="neon-cyan" />
            <ScoreRow label="Grammar" value={summary.grammar_score} variant="neon-purple" />
          </div>
        </GlassCard>

        <GlassCard className="p-5 mb-4">
          <h3 className="font-bold mb-2 text-sm uppercase tracking-widest text-ink-dim">Objetivos</h3>
          {summary.achieved_objectives?.map((o) => (
            <div key={o} className="text-sm py-1 text-neon-green">✔ {o}</div>
          ))}
          {summary.missed_objectives?.map((o) => (
            <div key={o} className="text-sm py-1 text-ink-dim">○ {o}</div>
          ))}
        </GlassCard>

        <GlassCard strong glowColor="purple" className="p-5 mb-4">
          <h3 className="font-bold mb-2 text-sm uppercase tracking-widest text-ink-dim">Feedback</h3>
          <p className="text-sm">{summary.feedback}</p>
          {summary.highlight_phrase && (
            <p className="text-sm italic text-neon-cyan mt-3">✨ "{summary.highlight_phrase}"</p>
          )}
          {summary.next_step && (
            <p className="text-sm text-ink-dim mt-3">💡 {summary.next_step}</p>
          )}
        </GlassCard>

        <div className="flex gap-3">
          <Link href={`/worlds?kid=${kid.id}`} className="flex-1">
            <NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton>
          </Link>
          <Link href={`/conversation?kid=${kid.id}`} className="flex-1">
            <NeonButton variant="primary" className="w-full">Otra conversación</NeonButton>
          </Link>
        </div>
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/conversation?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Cambiar</Link>
        <div className="text-xs font-bold text-neon-purple text-center">
          {scenario.emoji} {scenario.name}
        </div>
        <button onClick={finish} className="text-xs font-bold text-neon-green hover:underline" disabled={sending || userTurnsDone < 2}>
          Terminar
        </button>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto relative z-10">
        {/* Setting */}
        <GlassCard className="p-3 mb-3 text-center text-xs text-ink-dim italic">
          {scenario.setting}
        </GlassCard>

        {/* Chat */}
        <div className="space-y-3 mb-4">
          {history.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-neon-cyan/20 border border-neon-cyan/40 rounded-tr-sm"
                  : "bg-surface-mid border border-white/10 rounded-tl-sm"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-surface-mid border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-ink-dim italic animate-pulse">
                escribiendo…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="fixed bottom-20 left-0 right-0 px-5 z-30">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type in English…"
              disabled={sending || userTurnsDone >= MAX_TURNS}
              className="flex-1 px-4 py-3 rounded-full glass-strong border border-white/10 focus:border-neon-cyan focus:outline-none"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim() || userTurnsDone >= MAX_TURNS}
              className="px-5 rounded-full bg-neon-cyan text-surface font-bold disabled:opacity-40"
            >
              →
            </button>
          </div>
          <div className="text-center text-[10px] text-ink-dim mt-2">
            Turno {userTurnsDone}/{MAX_TURNS} · "Terminar" disponible tras 2 turnos
          </div>
        </div>
      </main>
    </>
  );
}

function ScoreRow({ label, value, variant }: { label: string; value: number; variant: "speaking" | "neon-cyan" | "neon-purple" }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="font-bold">{Math.round(value)}%</span>
      </div>
      <ProgressBar value={value} variant={variant} />
    </div>
  );
}
