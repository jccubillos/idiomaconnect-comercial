import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import type { CoachTask } from "@/lib/coach/coach";

/**
 * MISIÓN DEL DÍA — 3 tareas variadas (habilidades distintas) que guían la práctica
 * y evitan que el niño haga siempre lo mismo. Cada chip lleva a la actividad.
 */
export function DailyMission({
  tasks,
  doneCount,
  total,
}: {
  tasks: CoachTask[];
  doneCount: number;
  total: number;
}) {
  if (!total) return null;
  const complete = doneCount >= total;
  const accent = complete ? "#ffd23f" : "#00eefc";

  return (
    <GlassCard className="p-4 mb-6 border" style={{ borderColor: `${accent}40` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h3 className="font-bold text-sm">Misión del día</h3>
        </div>
        <div className="text-xs font-extrabold px-2.5 py-1 rounded-full" style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}55` }}>
          {doneCount}/{total}{complete ? " ✓" : ""}
        </div>
      </div>

      {/* Barra de progreso de la misión */}
      <div className="progress-track mb-4">
        <div
          className="progress-fill"
          style={{ width: `${(doneCount / total) * 100}%`, background: `linear-gradient(90deg, ${accent}, ${accent}99)` }}
        />
      </div>

      <div className="space-y-2">
        {tasks.map((t) => (
          <Link key={t.id} href={t.href}>
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                t.done
                  ? "border-white/5 opacity-55"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: t.done ? "rgba(255,255,255,0.06)" : `${accent}1a` }}
              >
                {t.done ? "✓" : t.emoji}
              </div>
              <span className={`text-sm font-medium flex-1 ${t.done ? "line-through text-ink-dim" : ""}`}>
                {t.label}
              </span>
              {!t.done && <span className="text-xs text-ink-dim">▶</span>}
            </div>
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}
