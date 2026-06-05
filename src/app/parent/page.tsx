"use client";

import { useState } from "react";
import Link from "next/link";
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

interface SkillData {
  xp: number;
  sessions: number;
  avgScore: number;
}

interface RecentSession {
  worldKey: string | null;
  lessonType: string;
  xpGained: number;
  scorePct: number | null;
}

interface ParentSummary {
  kid: KidSummary;
  weekXp: number;
  totalSessions: number;
  avgScore: number;
  streak: number;
  weakSkill: string | null;
  skills: Record<string, SkillData>;
  recentSessions: RecentSession[];
  hoursToNextLevel: number | null;
}

const SKILL_ORDER = ["vocabulary", "grammar", "listening", "speaking", "writing", "reading"] as const;
const SKILL_VARIANT: Record<
  string,
  "reading" | "listening" | "writing" | "speaking" | "neon-cyan" | "neon-purple"
> = {
  vocabulary: "neon-cyan",
  grammar: "neon-purple",
  listening: "listening",
  speaking: "speaking",
  writing: "writing",
  reading: "reading",
};
const SKILL_LABEL: Record<string, string> = {
  vocabulary: "Vocabulario",
  grammar: "Gramática",
  listening: "Comprensión auditiva",
  speaking: "Expresión oral",
  writing: "Escritura",
  reading: "Lectura",
};

function pretty(s: string | null): string {
  if (!s) return "—";
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function ParentDashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ParentSummary[] | null>(null);

  function tryUnlock(e: React.FormEvent) {
    e.preventDefault();
    fetchSummary(password);
  }

  async function fetchSummary(pwd: string) {
    setError(null);
    const res = await fetch("/api/parent/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.status === 403) { setError("Password incorrecto"); return; }
    if (!res.ok) { setError("Error del servidor"); return; }
    const json = await res.json();
    setData(json.kids);
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
    </main>
  );
}

function ParentRow({ row }: { row: ParentSummary }) {
  const { kid, weekXp, totalSessions, avgScore, streak, weakSkill, skills, recentSessions, hoursToNextLevel } = row;
  const cefr = getCefrInfo(kid.total_xp);
  return (
    <div className="mb-8">
      <h3 className="font-extrabold text-lg mb-2 flex items-center gap-2" style={{ color: kid.color_hex }}>
        <span className="text-2xl">{kid.emoji}</span> {kid.name}
        <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
          Nivel {cefr.code} · {cefr.name}
        </span>
      </h3>

      <GlassCard strong className="p-5 mb-4">
        {/* Nivel de inglés + progreso y estimación de horas */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-dim">Nivel de inglés</span>
            <span className="text-xs text-ink-dim">{cefr.nextLabel}</span>
          </div>
          <ProgressBar value={cefr.progress * 100} variant="neon-cyan" />
          <div className="flex justify-between mt-1.5">
            <p className="text-[11px] text-ink-dim">{cefr.tagline}</p>
            {hoursToNextLevel != null && (
              <p className="text-[11px] font-bold text-neon-green">
                ≈ {hoursToNextLevel} h de práctica para subir
              </p>
            )}
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <Mini label="XP total" value={String(kid.total_xp)} color={kid.color_hex} />
          <Mini label="XP semana" value={String(weekXp)} color="#39ff14" />
          <Mini label="Lecciones" value={String(totalSessions)} color="#00eefc" />
          <Mini label="Promedio" value={`${Math.round(avgScore * 100)}%`} color="#c464ff" />
          <Mini label="Racha" value={`🔥 ${streak}`} color="#ff5351" />
        </div>
      </GlassCard>

      {/* Desempeño por habilidad */}
      <GlassCard strong className="p-5 mb-4">
        <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
          <span className="text-neon-purple">📊</span> Desempeño por habilidad
        </h4>
        <div className="space-y-3">
          {SKILL_ORDER.map((skill) => {
            const d = skills[skill];
            const pct = d?.avgScore ? d.avgScore * 100 : 0;
            return (
              <div key={skill}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{SKILL_LABEL[skill]}</span>
                  <span className="text-ink-dim">
                    {d ? `${d.xp} XP · ${d.sessions} ses. · ${Math.round(pct)}%` : "Sin práctica"}
                  </span>
                </div>
                <ProgressBar value={pct} variant={SKILL_VARIANT[skill] ?? "neon-cyan"} />
              </div>
            );
          })}
        </div>
        {weakSkill && (
          <p className="text-xs text-ink-dim mt-4">
            💡 Sugerencia: practicar más{" "}
            <b style={{ color: kid.color_hex }}>{SKILL_LABEL[weakSkill] ?? pretty(weakSkill)}</b>.
          </p>
        )}
      </GlassCard>

      {/* Últimas sesiones */}
      <GlassCard strong className="p-5">
        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
          <span className="text-neon-cyan">🕒</span> Últimas sesiones
        </h4>
        {recentSessions.length === 0 ? (
          <p className="text-xs text-ink-dim">Aún no hay sesiones registradas.</p>
        ) : (
          <div className="space-y-1.5">
            {recentSessions.map((s, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-ink-dim">
                  {pretty(s.worldKey)} · <span className="text-on-surface">{pretty(s.lessonType)}</span>
                </span>
                <span className="font-bold whitespace-nowrap">
                  <span className="text-neon-green">+{s.xpGained} XP</span>
                  {s.scorePct != null && <span className="text-ink-dim"> · {Math.round(s.scorePct)}%</span>}
                </span>
              </div>
            ))}
          </div>
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
