"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import { LumiCharacter } from "@/components/coach/LumiCharacter";
import { LumiCelebration } from "@/components/coach/LumiCelebration";
import type { BattleWord } from "@/lib/content/vocabulary";

interface KidMini {
  id: string;
  name: string;
  emoji: string;
  avatar_url: string | null;
  color_hex: string;
  total_xp: number;
  cefr_level: string;
}

type Phase = "learn" | "countdown" | "fight" | "result";
const MAX_HP = 100;
const HIT_DAMAGE = 20;
const ROUND_SECONDS = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function BattleRunner({
  kid,
  worldKey,
  words,
}: {
  kid: KidMini;
  worldKey: string;
  words: BattleWord[];
}) {
  const [phase, setPhase] = useState<Phase>("learn");
  // Fase aprender
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [loadingWord, setLoadingWord] = useState<string | null>(null);
  // Cuenta regresiva
  const [count, setCount] = useState(3);
  // Batalla
  const [queue, setQueue] = useState<number[]>(() => words.map((_, i) => i));
  const [opts, setOpts] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [mastered, setMastered] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [startedAt] = useState(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const total = words.length;
  const currentIdx = queue[0];
  const current = currentIdx != null ? words[currentIdx] : null;
  const enemyHp = Math.round((queue.length / total) * 100);
  const allHeard = heard.size >= total;

  async function playWord(en: string) {
    setLoadingWord(en);
    try {
      const res = await fetch("/api/audio/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: en, kidId: kid.id }),
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
        audioRef.current?.pause();
        const a = new Audio(url);
        audioRef.current = a;
        await a.play().catch(() => {});
      }
    } catch {
      // El audio es opcional: si falla (p. ej. sin API key), igual marcamos como escuchada.
    } finally {
      setLoadingWord(null);
      setHeard((prev) => new Set(prev).add(en));
    }
  }

  // Cuenta regresiva 3-2-1 antes de la batalla
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      setPhase("fight");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, count]);

  // Al cambiar la palabra actual (frente de la cola): barajar opciones + reiniciar timer
  useEffect(() => {
    if (phase !== "fight" || !current) return;
    setOpts(shuffle(current.options));
    setPicked(null);
    setSecondsLeft(ROUND_SECONDS);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          answer(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx]);

  // Condiciones de fin
  useEffect(() => {
    if (phase !== "fight") return;
    if (queue.length === 0 || playerHp <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length, playerHp, phase]);

  function answer(option: string | null) {
    if (picked || !current) return;
    if (tickRef.current) clearInterval(tickRef.current);
    setPicked(option ?? "(timeout)");
    const correct = option === current.es;
    setTimeout(() => {
      setQueue((q) => {
        const [front, ...rest] = q;
        return correct ? rest : [...rest, front]; // acierto: dominada; error: vuelve a la cola
      });
      if (correct) {
        setMastered((m) => m + 1);
      } else {
        setWrongCount((w) => w + 1);
        setPlayerHp((hp) => Math.max(0, hp - HIT_DAMAGE));
      }
    }, 1000);
  }

  async function finish() {
    if (phase === "result") return;
    if (tickRef.current) clearInterval(tickRef.current);
    setPhase("result");
    const won = queue.length === 0;
    const scorePct = total ? Math.round((mastered / total) * 100) : 0;
    const xp = won ? 40 : mastered >= Math.ceil(total / 2) ? 20 : 8;
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
          scorePct,
          xpGained: xp,
          attempts: 1,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
    } catch {
      // no-fatal
    }
  }

  // ───────────────────────── FASE: APRENDER ─────────────────────────
  if (phase === "learn") {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
          <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">← Worlds</Link>
          <div className="text-xs font-bold text-neon-red">⚔️ Battle · Aprende</div>
        </header>
        <main className="pt-24 pb-32 px-5 max-w-xl mx-auto relative z-10">
          <div className="text-center mb-5">
            <div className="flex justify-center mb-2"><LumiCharacter mood="suggest" size={96} /></div>
            <h1 className="text-2xl font-extrabold mb-1">Aprende estas palabras</h1>
            <p className="text-sm text-ink-dim">
              Toca 🔊 para escuchar cada una. Cuando las escuches todas, ¡a la batalla!
            </p>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-dim">
              Escuchadas {heard.size}/{total}
            </span>
            <div className="progress-track w-32">
              <div className="progress-fill" style={{ width: `${(heard.size / total) * 100}%`, background: "linear-gradient(90deg,#00eefc,#39ff14)" }} />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {words.map((w) => {
              const isHeard = heard.has(w.en);
              return (
                <GlassCard key={w.en} className={`p-3 flex items-center gap-3 border ${isHeard ? "border-neon-green/40" : "border-white/10"}`}>
                  <button
                    onClick={() => playWord(w.en)}
                    disabled={loadingWord === w.en}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-neon-cyan/15 border border-neon-cyan/40 hover:scale-105 transition-transform"
                    aria-label={`Escuchar ${w.en}`}
                  >
                    {loadingWord === w.en ? "…" : "🔊"}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold">{w.en} <span className="text-xs font-normal text-ink-dim">[{w.pron}]</span></div>
                    <div className="text-sm text-ink-dim">{w.es}</div>
                  </div>
                  {isHeard && <span className="text-neon-green text-lg flex-shrink-0">✓</span>}
                </GlassCard>
              );
            })}
          </div>

          <NeonButton
            variant="primary"
            size="lg"
            onClick={() => { setCount(3); setPhase("countdown"); }}
            disabled={!allHeard}
            className="w-full"
          >
            {allHeard ? "⚔️ ¡A la batalla!" : `Escucha todas para continuar (${heard.size}/${total})`}
          </NeonButton>
        </main>
      </>
    );
  }

  // ───────────────────────── FASE: CUENTA REGRESIVA ─────────────────────────
  if (phase === "countdown") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-4"><LumiCharacter mood="suggest" size={120} /></div>
          <div className="text-7xl font-extrabold text-glow-red text-neon-red animate-pulse">
            {count > 0 ? count : "¡YA!"}
          </div>
          <p className="text-sm text-ink-dim mt-3">Prepárate…</p>
        </div>
      </main>
    );
  }

  // ───────────────────────── FASE: RESULTADO ─────────────────────────
  if (phase === "result") {
    const won = queue.length === 0;
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <GlassCard strong glowColor={won ? "green" : "red"} className="p-8 max-w-md w-full text-center">
          <LumiCelebration mood={won ? "celebrate" : "encourage"} size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-1">{won ? "¡Victoria!" : "El virus te ganó"}</h2>
          <p className="text-sm text-ink-dim mb-6">
            Palabras dominadas: {mastered}/{total} · HP final {playerHp}/{MAX_HP}
          </p>
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

  // ───────────────────────── FASE: BATALLA ─────────────────────────
  if (!current) return null;
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <div className="text-xs font-bold uppercase tracking-widest text-neon-red">⚔️ Vocab Battle</div>
        <div className="text-xs font-bold">Dominadas {mastered}/{total}</div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto relative z-10">
        {/* Barras de HP */}
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
              <div className="progress-fill hp-enemy" style={{ width: `${enemyHp}%` }} />
            </div>
            <div className="text-xs mt-1 text-neon-red">{queue.length} palabras restantes</div>
          </div>
        </section>

        {/* Palabra objetivo — Lumi presenta la palabra (antes había un gusano) */}
        <GlassCard strong className="p-8 mb-5 text-center relative overflow-hidden border border-neon-cyan/30">
          <div className="relative z-10">
            <div className="flex justify-center mb-3">
              <LumiCharacter mood="suggest" size={84} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 text-ink-dim border border-white/10">
              ¿Qué significa?
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-4 mb-1 text-glow-cyan text-neon-cyan">
              {current.en}
            </h2>
            <div className="text-sm text-ink-dim">[{current.pron}]</div>
          </div>
        </GlassCard>

        {/* Opciones (posición de la correcta barajada cada vez) */}
        <section className="grid grid-cols-2 gap-3">
          {opts.map((opt) => {
            const isPicked = picked === opt;
            const isCorrect = picked && opt === current.es;
            const isWrong = isPicked && opt !== current.es;
            return (
              <button
                key={opt}
                onClick={() => answer(opt)}
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
          </div>
        </div>
      </main>
    </>
  );
}
