"use client";

import { LumiCelebration } from "@/components/coach/LumiCelebration";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import type { BattleRound } from "@/lib/groq/vocab-battle";

interface KidMini {
  id: string;
  name: string;
  emoji: string;
  avatar_url: string | null;
  color_hex: string;
  total_xp: number;
  cefr_level: string;
}

type Phase = "loading" | "fight" | "result" | "error";
const MAX_HP = 100;
const HIT_DAMAGE = 20;
const TIMER_SECONDS = 12;

export function BattleRunner({ kid, worldKey }: { kid: KidMini; worldKey: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [rounds, setRounds] = useState<BattleRound[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [enemyHp, setEnemyHp] = useState(MAX_HP);
  const [picked, setPicked] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [startedAt] = useState(Date.now());
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  // Generate rounds on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/battle/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kidId: kid.id, worldKey, rounds: 8 }),
        });
        if (cancelled) return;
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? "No pude armar el combate");
          setPhase("error");
          return;
        }
        const data = await res.json();
        setRounds(data.rounds);
        setPhase("fight");
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          setPhase("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [kid.id, worldKey]);

  // Timer per round
  useEffect(() => {
    if (phase !== "fight" || picked) return;
    setSecondsLeft(TIMER_SECONDS);
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current!);
          handleAnswer(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase, roundIdx, picked]);

  // Check end conditions
  useEffect(() => {
    if (phase !== "fight") return;
    if (playerHp <= 0 || enemyHp <= 0 || roundIdx >= rounds.length) {
      finish();
    }
  }, [playerHp, enemyHp, roundIdx, phase, rounds.length]);

  function handleAnswer(option: string | null) {
    if (picked) return;
    setPicked(option ?? "(timeout)");
    if (tickRef.current) clearInterval(tickRef.current);
    const current = rounds[roundIdx];
    const correct = option === current.answer_es;
    if (correct) {
      setEnemyHp((hp) => Math.max(0, hp - HIT_DAMAGE));
    } else {
      setPlayerHp((hp) => Math.max(0, hp - HIT_DAMAGE));
    }
    setTimeout(() => {
      setPicked(null);
      setRoundIdx((i) => i + 1);
    }, 1200);
  }

  async function finish() {
    if (phase === "result") return;
    setPhase("result");
    const correctRounds = Math.round((MAX_HP - enemyHp) / HIT_DAMAGE);
    const total = Math.min(rounds.length, roundIdx);
    const scorePct = total ? correctRounds / total : 0;
    const won = enemyHp <= 0;
    const xp = won ? 40 : correctRounds >= 3 ? 20 : 5;

    try {
      await fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: kid.id,
          lessonType: "battle",
          worldKey,
          topic: "Vocab Battle",
          skill: "vocabulary",
          scorePct: scorePct * 100,
          xpGained: xp,
          attempts: 1,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch {
      // Non-fatal
    }
  }

  if (phase === "loading") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 relative z-10">
        <GlassCard strong className="p-8 text-center">
          <div className="text-4xl mb-3 animate-pulse">⚔️</div>
          <h2 className="font-bold text-lg mb-1">Preparando el combate…</h2>
          <p className="text-sm text-ink-dim">El Syntax Virus se materializa</p>
        </GlassCard>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 relative z-10">
        <GlassCard strong className="p-8 text-center max-w-md">
          <div className="text-4xl mb-3">💥</div>
          <h2 className="font-bold text-lg mb-2">Falló el combate</h2>
          <p className="text-sm text-ink-dim mb-4">{error}</p>
          <Link href={`/worlds?kid=${kid.id}`}><NeonButton variant="ghost-cyan">Volver</NeonButton></Link>
        </GlassCard>
      </main>
    );
  }

  if (phase === "result") {
    const won = enemyHp <= 0;
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <GlassCard strong glowColor={won ? "green" : "red"} className="p-8 max-w-md w-full text-center">
          <LumiCelebration mood={won ? "celebrate" : "encourage"} size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">
            {won ? "¡Victoria!" : "El virus te ganó"}
          </h2>
          <p className="text-sm text-ink-dim mb-6">HP final: {playerHp} / {MAX_HP}</p>
          <div className="flex gap-3">
            <Link href={`/worlds?kid=${kid.id}`} className="flex-1">
              <NeonButton variant="ghost-cyan" className="w-full">Worlds</NeonButton>
            </Link>
            <Link href={`/battle?kid=${kid.id}&world=${worldKey}`} className="flex-1">
              <NeonButton variant="primary" className="w-full">Otra batalla</NeonButton>
            </Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  const current = rounds[roundIdx];
  if (!current) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <div className="text-xs font-bold uppercase tracking-widest text-neon-red">⚔️ Vocab Battle</div>
        <div className="flex items-center gap-1 text-xs font-bold">
          <span className="text-neon-green">⚡</span>
          <span>+{Math.max(5, Math.round((MAX_HP - enemyHp) * 0.4))} XP</span>
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto relative z-10">
        {/* HP Bars */}
        <section className="flex justify-between items-center gap-3 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Avatar src={kid.avatar_url} emoji={kid.emoji} name={kid.name} ringColor={kid.color_hex} size="sm" />
              <span className="text-xs font-bold uppercase tracking-widest text-neon-cyan">{kid.name}</span>
            </div>
            <div className="progress-track h-3.5 border border-neon-cyan/30">
              <div className="progress-fill hp-player" style={{ width: `${(playerHp / MAX_HP) * 100}%` }} />
            </div>
            <div className="text-xs mt-1 text-neon-cyan">HP {playerHp}/{MAX_HP}</div>
          </div>
          <div className="text-2xl font-extrabold animate-pulse text-glow-red text-neon-red">VS</div>
          <div className="flex-1 text-right">
            <div className="flex items-center gap-1 mb-1 justify-end">
              <span className="text-xs font-bold uppercase tracking-widest text-neon-red">Syntax Virus</span>
              <span className="text-base">🦠</span>
            </div>
            <div className="progress-track h-3.5 border border-neon-red/30 flex flex-row-reverse">
              <div className="progress-fill hp-enemy" style={{ width: `${(enemyHp / MAX_HP) * 100}%` }} />
            </div>
            <div className="text-xs mt-1 text-neon-red">HP {enemyHp}/{MAX_HP}</div>
          </div>
        </section>

        {/* Target word */}
        <GlassCard strong className="p-8 mb-5 text-center relative overflow-hidden border border-neon-red/30">
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(circle, rgba(255,75,75,0.1), transparent 70%)",
          }} />
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-dashed border-neon-red flex items-center justify-center text-4xl animate-float">
              🦠
            </div>
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 text-ink-dim border border-white/10">
              DECODE
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-4 mb-1 text-glow-red text-neon-red">
              {current.word_en}
            </h2>
            {current.pronunciation && (
              <div className="text-sm text-ink-dim mb-1">{current.pronunciation}</div>
            )}
            <p className="text-sm italic text-ink-dim">¿Qué significa esta palabra?</p>
          </div>
        </GlassCard>

        {/* Options */}
        <section className="grid grid-cols-2 gap-3">
          {current.options_es.map((opt) => {
            const isPicked = picked === opt;
            const isCorrect = picked && opt === current.answer_es;
            const isWrong = isPicked && opt !== current.answer_es;
            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={!!picked}
                className={`glass rounded-xl p-4 transition-all border ${
                  isCorrect
                    ? "border-neon-green bg-neon-green/15 shadow-neon-green"
                    : isWrong
                    ? "border-neon-red bg-neon-red/15"
                    : "border-neon-cyan/30 hover:scale-[1.02]"
                }`}
              >
                <div className="font-bold text-sm">{opt}</div>
              </button>
            );
          })}
        </section>

        <div className="text-center mt-6">
          <div className="inline-block px-4 py-2 rounded-full glass text-xs font-bold">
            ⏱️ <span className={secondsLeft <= 3 ? "text-neon-red" : "text-neon-green"}>{secondsLeft}s</span>
            {" "}· Round {roundIdx + 1}/{rounds.length}
          </div>
        </div>
      </main>
    </>
  );
}
