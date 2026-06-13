"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import { LumiCharacter } from "@/components/coach/LumiCharacter";
import { LumiCelebration } from "@/components/coach/LumiCelebration";
import { buildBattleSession, type BattleWord } from "@/lib/content/vocabulary";
import { getCefrInfo } from "@/lib/content/cefr";

/**
 * 🥊 DUELO FAMILIAR (Plus) — 2 jugadores en el MISMO dispositivo.
 * Padre vs hijo, hermana vs hermano: cada uno responde 8 palabras del mismo
 * nivel, con el teléfono pasando de mano en mano. Veredicto final compartible.
 *
 * El "adulto invitado" juega sin perfil (no gana XP); los niños sí guardan
 * su sesión y XP.
 */

export interface DueloKid {
  id: string;
  name: string;
  emoji: string;
  avatar_url: string | null;
  color_hex: string;
  total_xp: number;
}

type Player =
  | { type: "kid"; kid: DueloKid }
  | { type: "guest"; name: string };

type Phase = "setup" | "handoff" | "play" | "verdict";

const WORDS_PER_PLAYER = 8;
const ROUND_SECONDS = 10;

const playerName = (p: Player) => (p.type === "kid" ? p.kid.name : p.name);
const playerEmoji = (p: Player) => (p.type === "kid" ? p.kid.emoji : "🧑");

export function DueloRunner({ kids }: { kids: DueloKid[] }) {
  const [phase, setPhase] = useState<Phase>("setup");
  // Setup
  const [p1, setP1] = useState<DueloKid | null>(null);
  const [p2, setP2] = useState<Player | null>(null);
  const [guestName, setGuestName] = useState("Papá / Mamá");
  // Juego
  const [words, setWords] = useState<BattleWord[]>([]);
  const [turn, setTurn] = useState<0 | 1>(0); // 0 = P1, 1 = P2
  const [idx, setIdx] = useState(0);          // índice dentro de las 8 del jugador
  const [picked, setPicked] = useState<string | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [startedAt] = useState(Date.now());
  const [saved, setSaved] = useState(false);

  const players: [Player, Player] | null =
    p1 && p2 ? [{ type: "kid", kid: p1 }, p2] : null;
  const current = players?.[turn] ?? null;
  const myWords = words.slice(turn * WORDS_PER_PLAYER, (turn + 1) * WORDS_PER_PLAYER);
  const word = myWords[idx] ?? null;

  function start() {
    if (!p1 || !p2) return;
    // Nivel del duelo: el más alto entre los niños participantes (el invitado se adapta).
    const xps = [p1.total_xp, ...(p2.type === "kid" ? [p2.kid.total_xp] : [])];
    const level = getCefrInfo(Math.max(...xps)).code;
    setWords(buildBattleSession(level, WORDS_PER_PLAYER * 2));
    setScores([0, 0]);
    setTurn(0);
    setIdx(0);
    setPicked(null);
    setSaved(false);
    setPhase("handoff");
  }

  // Timer por palabra
  useEffect(() => {
    if (phase !== "play" || !word) return;
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
  }, [phase, turn, idx]);

  function answer(option: string | null) {
    if (picked || !word) return;
    if (tickRef.current) clearInterval(tickRef.current);
    setPicked(option ?? "(timeout)");
    const correct = option === word.es;
    if (correct) {
      setScores((s) => (turn === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]));
    }
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 < WORDS_PER_PLAYER) {
        setIdx(idx + 1);
      } else if (turn === 0) {
        setTurn(1);
        setIdx(0);
        setPhase("handoff");
      } else {
        setPhase("verdict");
      }
    }, 1100);
  }

  // Guardar XP de los NIÑOS al llegar al veredicto (el invitado no guarda).
  useEffect(() => {
    if (phase !== "verdict" || saved || !players) return;
    setSaved(true);
    const [s1, s2] = scores;
    const duration = Math.round((Date.now() - startedAt) / 1000);
    const entries: Array<{ kid: DueloKid; my: number; other: number }> = [];
    entries.push({ kid: p1!, my: s1, other: s2 });
    if (p2 && p2.type === "kid") entries.push({ kid: p2.kid, my: s2, other: s1 });
    for (const e of entries) {
      const won = e.my > e.other;
      const tie = e.my === e.other;
      fetch("/api/xp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: e.kid.id,
          lessonType: "duel",
          worldKey: "duelo",
          topic: "Duelo Familiar",
          skill: "vocabulary",
          scorePct: Math.round((e.my / WORDS_PER_PLAYER) * 100),
          xpGained: won ? 30 : tie ? 20 : 12,
          attempts: 1,
          durationSeconds: duration,
        }),
      }).catch(() => { /* no fatal */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ───────────────────── SETUP ───────────────────── */
  if (phase === "setup") {
    const availableP2 = kids.filter((k) => k.id !== p1?.id);
    return (
      <main className="pt-10 pb-32 px-5 max-w-xl mx-auto relative z-10">
        <Link href="/arena" className="text-sm font-bold text-neon-cyan">← Arena</Link>
        <div className="text-center my-6">
          <div className="text-4xl mb-1">🥊</div>
          <h1 className="text-3xl font-extrabold mb-1">Duelo Familiar</h1>
          <p className="text-sm text-ink-dim">
            2 jugadores · 1 teléfono · {WORDS_PER_PLAYER} palabras cada uno. ¿Quién sabe más inglés?
          </p>
        </div>

        <GlassCard strong className="p-5 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-3">
            🟦 Jugador 1 (niño/a)
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {kids.map((k) => (
              <button
                key={k.id}
                onClick={() => { setP1(k); if (p2?.type === "kid" && p2.kid.id === k.id) setP2(null); }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  p1?.id === k.id ? "border-neon-cyan bg-neon-cyan/10 scale-[1.03]" : "border-white/10 bg-surface-mid"
                }`}
              >
                <div className="mx-auto mb-1" style={{ width: "fit-content" }}>
                  <Avatar src={k.avatar_url} emoji={k.emoji ?? "👤"} name={k.name} ringColor={k.color_hex} size="sm" />
                </div>
                <div className="text-xs font-bold truncate">{k.name}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard strong className="p-5 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neon-red mb-3">
            🟥 Jugador 2 (rival)
          </h2>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {availableP2.map((k) => (
              <button
                key={k.id}
                onClick={() => setP2({ type: "kid", kid: k })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  p2?.type === "kid" && p2.kid.id === k.id ? "border-neon-red bg-neon-red/10 scale-[1.03]" : "border-white/10 bg-surface-mid"
                }`}
              >
                <div className="mx-auto mb-1" style={{ width: "fit-content" }}>
                  <Avatar src={k.avatar_url} emoji={k.emoji ?? "👤"} name={k.name} ringColor={k.color_hex} size="sm" />
                </div>
                <div className="text-xs font-bold truncate">{k.name}</div>
              </button>
            ))}
            <button
              onClick={() => setP2({ type: "guest", name: guestName.trim() || "Invitado" })}
              className={`p-3 rounded-xl border text-center transition-all ${
                p2?.type === "guest" ? "border-neon-red bg-neon-red/10 scale-[1.03]" : "border-white/10 bg-surface-mid"
              }`}
            >
              <div className="text-2xl mb-1">🧑</div>
              <div className="text-xs font-bold">Adulto invitado</div>
            </button>
          </div>
          {p2?.type === "guest" && (
            <input
              type="text"
              maxLength={30}
              value={guestName}
              onChange={(e) => { setGuestName(e.target.value); setP2({ type: "guest", name: e.target.value.trim() || "Invitado" }); }}
              placeholder="Nombre del adulto (ej: Papá)"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-red focus:outline-none text-sm"
            />
          )}
          <p className="text-[11px] text-ink-dim mt-2">
            El adulto invitado juega sin perfil: la gloria es suya, el XP es de los niños. 😄
          </p>
        </GlassCard>

        <NeonButton variant="primary" size="lg" className="w-full" disabled={!p1 || !p2} onClick={start}>
          {p1 && p2 ? `🥊 ¡${p1.name} vs ${playerName(p2)}!` : "Elige a los 2 jugadores"}
        </NeonButton>
      </main>
    );
  }

  if (!players || !current) return null;

  /* ───────────────────── PASA EL TELÉFONO ───────────────────── */
  if (phase === "handoff") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 relative z-10">
        <GlassCard strong className="p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-3"><LumiCharacter mood="suggest" size={110} /></div>
          <div className="text-5xl mb-3">📱</div>
          <h2 className="text-2xl font-extrabold mb-2">
            ¡Pásale el teléfono a {playerName(current)}!
          </h2>
          <p className="text-sm text-ink-dim mb-6">
            {playerEmoji(current)} {playerName(current)}: vas a responder {WORDS_PER_PLAYER} palabras,
            {" "}{ROUND_SECONDS} segundos cada una. ¡Sin ayuda del rival!
          </p>
          <NeonButton variant="primary" size="lg" className="w-full" onClick={() => setPhase("play")}>
            ¡Estoy listo/a!
          </NeonButton>
        </GlassCard>
      </main>
    );
  }

  /* ───────────────────── VEREDICTO ───────────────────── */
  if (phase === "verdict") {
    const [s1, s2] = scores;
    const n1 = p1!.name;
    const n2 = playerName(players[1]);
    const winner = s1 > s2 ? n1 : s2 > s1 ? n2 : null;
    const shareText = `🥊 Duelo Familiar de inglés en IdiomaConnect: ${n1} ${s1} – ${s2} ${n2} ${winner ? `· ¡Ganó ${winner}! 🏆` : "· ¡Empate!"} ¿Le ganarías a tu hijo/a? 👉 https://idiomaconnect.com`;
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <GlassCard strong glowColor={winner ? "green" : "cyan"} className="p-8 max-w-md w-full text-center">
          <LumiCelebration mood="celebrate" size={150} className="mb-3" />
          <h2 className="text-2xl font-extrabold mb-4">
            {winner ? `🏆 ¡Ganó ${winner}!` : "🤝 ¡Empate!"}
          </h2>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl">{playerEmoji(players[0])}</div>
              <div className="font-bold text-sm">{n1}</div>
              <div className="text-3xl font-extrabold text-neon-cyan">{s1}</div>
            </div>
            <div className="text-xl font-extrabold text-ink-dim">VS</div>
            <div className="text-center">
              <div className="text-3xl">{playerEmoji(players[1])}</div>
              <div className="font-bold text-sm">{n2}</div>
              <div className="text-3xl font-extrabold text-neon-red">{s2}</div>
            </div>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-3"
          >
            <NeonButton variant="ghost-purple" className="w-full">📱 Presumir el resultado</NeonButton>
          </a>
          <div className="flex gap-3">
            <Link href="/arena" className="flex-1">
              <NeonButton variant="ghost-cyan" className="w-full">Arena</NeonButton>
            </Link>
            <NeonButton variant="primary" className="flex-1" onClick={() => setPhase("setup")}>
              🔄 Revancha
            </NeonButton>
          </div>
        </GlassCard>
      </main>
    );
  }

  /* ───────────────────── JUEGO ───────────────────── */
  if (!word) return null;
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <div className="text-xs font-bold uppercase tracking-widest text-neon-red">🥊 Duelo Familiar</div>
        <div className="text-xs font-bold">
          {playerEmoji(current)} {playerName(current)} · {idx + 1}/{WORDS_PER_PLAYER}
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto relative z-10">
        {/* Marcador */}
        <div className="flex justify-center items-center gap-4 mb-6 text-sm font-bold">
          <span className={turn === 0 ? "text-neon-cyan" : "text-ink-dim"}>
            {playerEmoji(players[0])} {p1!.name}: {scores[0]}
          </span>
          <span className="text-ink-dim">·</span>
          <span className={turn === 1 ? "text-neon-red" : "text-ink-dim"}>
            {playerEmoji(players[1])} {playerName(players[1])}: {scores[1]}
          </span>
        </div>

        <GlassCard strong className="p-8 mb-5 text-center border border-neon-cyan/30">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 text-ink-dim border border-white/10">
            ¿Qué significa?
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-4 mb-1 text-glow-cyan text-neon-cyan">
            {word.en}
          </h2>
          <div className="text-sm text-ink-dim">[{word.pron}]</div>
        </GlassCard>

        <section className="grid grid-cols-2 gap-3">
          {word.options.map((opt) => {
            const isPicked = picked === opt;
            const isCorrect = picked && opt === word.es;
            const isWrong = isPicked && opt !== word.es;
            return (
              <button
                key={opt}
                onClick={() => answer(opt)}
                disabled={!!picked}
                className={`glass rounded-xl p-4 transition-all border ${
                  isCorrect
                    ? "border-neon-green bg-neon-green/15"
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
