"use client";

import { LumiCelebration } from "@/components/coach/LumiCelebration";

import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";

export interface ProductionEvalLite {
  fluency_score: number;
  vocab_score: number;
  grammar_score: number;
  feedback_es: string;
  corrected_version: string;
  highlight_phrase?: string;
}

/**
 * Reusable evaluation card for Speaking Journal / Translate Inverse / Describe Scene
 * and any other "produce free text → get scored" mode.
 */
export function EvalResult({
  evaluation,
  userOutput,
  showOriginal = false,
}: {
  evaluation: ProductionEvalLite;
  userOutput: string;
  showOriginal?: boolean;
}) {
  const avg = Math.round((evaluation.fluency_score + evaluation.vocab_score + evaluation.grammar_score) / 3);

  return (
    <div className="space-y-4">
      <GlassCard strong glowColor={avg >= 70 ? "green" : "cyan"} className="p-6 text-center">
        <LumiCelebration score={avg} size={132} className="mb-2" />
        <div className="text-4xl font-extrabold text-neon-green mb-1">{avg}</div>
        <div className="text-xs text-ink-dim">promedio general</div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="space-y-3">
          <ScoreRow label="Fluency" value={evaluation.fluency_score} variant="speaking" />
          <ScoreRow label="Vocabulary" value={evaluation.vocab_score} variant="neon-cyan" />
          <ScoreRow label="Grammar" value={evaluation.grammar_score} variant="neon-purple" />
        </div>
      </GlassCard>

      {showOriginal && (
        <GlassCard className="p-4">
          <div className="text-xs uppercase tracking-widest text-ink-dim mb-1">Lo que escribiste/dijiste</div>
          <div className="text-sm italic">"{userOutput}"</div>
        </GlassCard>
      )}

      <GlassCard strong glowColor="green" className="p-4">
        <div className="text-xs uppercase tracking-widest text-ink-dim mb-1">Versión corregida</div>
        <div className="text-sm text-neon-green">"{evaluation.corrected_version}"</div>
      </GlassCard>

      <GlassCard strong glowColor="purple" className="p-4">
        <div className="text-xs uppercase tracking-widest text-ink-dim mb-1">Feedback</div>
        <p className="text-sm">{evaluation.feedback_es}</p>
        {evaluation.highlight_phrase && (
          <p className="text-sm italic text-neon-cyan mt-3">✨ "{evaluation.highlight_phrase}"</p>
        )}
      </GlassCard>
    </div>
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
