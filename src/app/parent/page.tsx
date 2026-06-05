"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getCefrInfo } from "@/lib/content/cefr";

interface KidSummary {
  id: string;
  name: string;
  emoji: string;
  color_hex: string;
  total_xp: number;
  cefr_level: string;
  hobbies: string | null;
}

interface ParentSummary {
  kid: KidSummary;
  weekXp: number;
  totalSessions: number;
  avgScore: number;
  streak: number;
  weakSkill: string | null;
}

interface UsageInfo {
  totalUsd: number;
  totalEvents: number;
  windowDays: number;
  buckets: { event_type: string; events: number; costCents: number }[];
}

export default function ParentDashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ParentSummary[] | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  function tryUnlock(e: React.FormEvent) {
    e.preventDefault();
    fetchSummary(password);
  }

  async function fetchSummary(pwd: string) {
    setError(null);
    const [sumRes, useRes] = await Promise.all([
      fetch("/api/parent/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      }),
      fetch("/api/parent/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      }),
    ]);
    if (sumRes.status === 403) { setError("Password incorrecto"); return; }
    if (!sumRes.ok) { setError("Error del servidor"); return; }
    const sumJson = await sumRes.json();
    setData(sumJson.kids);
    if (useRes.ok) setUsage(await useRes.json());
    setAuthed(true);
  }

  if (!authed) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <GlassCard strong className="w-full max-w-md p-8">
          <div className="text-5xl text-center mb-3">👨‍👩‍👧</div>
          <h1 className="text-2xl font-extrabold text-center mb-1">Dashboard de padres</h1>
          <p className="text-sm text-ink-dim text-center mb-6">Ingresa la clave familiar.</p>
          <form onSubmit={tryUnlock} className="space-y-4">
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none"
              required
            />
            {error && <div className="text-sm text-neon-red">{error}</div>}
            <NeonButton type="submit" className="w-full" size="lg">Entrar</NeonButton>
          </form>
          <div className="mt-4 text-center text-xs text-ink-dim">
            Cambia esta clave en{" "}
            <Link href="/account/settings" className="text-neon-cyan underline">Settings</Link>.
          </div>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="pt-12 pb-32 px-5 max-w-3xl mx-auto relative z-10">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold mb-1">Resumen familiar</h1>
        <p className="text-sm text-ink-dim">Progreso de cada perfil</p>
      </div>

      <Link href="/profiles">
        <NeonButton variant="ghost-cyan" size="sm" className="mb-6">← Volver a perfiles</NeonButton>
      </Link>

      {data?.map((row) => (
        <ParentRow key={row.kid.id} row={row} />
      ))}

      {usage && (
        <div className="mt-8">
          <h3 className="font-bold text-lg mb-2">📊 Uso & Costos (últimos {usage.windowDays} días)</h3>
          <GlassCard strong className="p-5">
            <div className="text-center mb-4">
              <div className="text-4xl font-extrabold text-neon-green">
                ${usage.totalUsd.toFixed(2)}
              </div>
              <div className="text-xs text-ink-dim">
                en {usage.totalEvents} llamadas a IA
              </div>
            </div>
            <div className="space-y-1.5">
              {usage.buckets.map((b) => (
                <div key={b.event_type} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                  <span className="text-ink-dim">{labelFor(b.event_type)}</span>
                  <span>
                    <span className="text-ink-dim">{b.events}× ·</span>{" "}
                    <span className="font-bold">${(b.costCents / 100).toFixed(2)}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-dim mt-3">
              💡 Costos se cubren con tu suscripción. Esto es solo para que veas qué consume más.
            </p>
          </GlassCard>
        </div>
      )}
    </main>
  );
}

function labelFor(type: string): string {
  switch (type) {
    case "lesson_generate": return "Lecciones generadas";
    case "llm_chat": return "Conversación / Battle";
    case "whisper_transcribe": return "Transcripción de voz";
    case "tts": return "Síntesis de voz";
    default: return type;
  }
}

function ParentRow({ row }: { row: ParentSummary }) {
  const { kid, weekXp, totalSessions, avgScore, streak, weakSkill } = row;
  const cefr = getCefrInfo(kid.total_xp);
  return (
    <div className="mb-6">
      <h3 className="font-extrabold text-lg mb-2 flex items-center gap-2" style={{ color: kid.color_hex }}>
        <span className="text-2xl">{kid.emoji}</span> {kid.name}
        <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
          Nivel {cefr.code} · {cefr.name}
        </span>
      </h3>
      <GlassCard strong className="p-5">
        {/* Nivel de inglés (CEFR) + progreso al siguiente */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-dim">Nivel de inglés</span>
            <span className="text-xs text-ink-dim">{cefr.nextLabel}</span>
          </div>
          <ProgressBar value={cefr.progress * 100} variant="neon-cyan" />
          <p className="text-[11px] text-ink-dim mt-1.5">{cefr.tagline}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center mb-4">
          <Mini label="XP total" value={String(kid.total_xp)} color={kid.color_hex} />
          <Mini label="XP semana" value={String(weekXp)} color="#39ff14" />
          <Mini label="Lecciones" value={String(totalSessions)} color="#00eefc" />
          <Mini label="Promedio" value={`${Math.round(avgScore * 100)}%`} color="#c464ff" />
          <Mini label="Racha" value={`🔥 ${streak}`} color="#ff5351" />
        </div>
        {weakSkill && (
          <p className="text-xs text-ink-dim">
            💡 Sugerencia: practicar más <b className="capitalize" style={{ color: kid.color_hex }}>{weakSkill}</b>.
          </p>
        )}
      </GlassCard>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-ink-dim">{label}</div>
    </div>
  );
}
