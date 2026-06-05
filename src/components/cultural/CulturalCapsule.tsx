import { GlassCard } from "@/components/ui/GlassCard";
import { getCulturalCapsule } from "@/lib/content/cultural";

/**
 * Daily cultural capsule — idiom + song line + fact, deterministic per day.
 * Pure presentational. Safe to render in any server component.
 */
export function CulturalCapsule({ className }: { className?: string }) {
  const c = getCulturalCapsule();
  return (
    <GlassCard className={`p-4 ${className ?? ""}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-neon-cyan mb-2">
        🌐 Cápsula del día
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <div className="text-ink-dim text-[10px] uppercase tracking-wide">Idiom</div>
          <div className="font-bold text-neon-cyan">{c.idiom.en}</div>
          <div className="text-xs text-ink-dim italic">≈ {c.idiom.es}</div>
        </div>
        <div>
          <div className="text-ink-dim text-[10px] uppercase tracking-wide">Letra del día</div>
          <div className="italic text-neon-purple">"{c.song.line}"</div>
          <div className="text-xs text-ink-dim">{c.song.song}</div>
        </div>
        <div>
          <div className="text-ink-dim text-[10px] uppercase tracking-wide">Dato curioso</div>
          <div className="text-xs">{c.fact.en}</div>
        </div>
      </div>
    </GlassCard>
  );
}
