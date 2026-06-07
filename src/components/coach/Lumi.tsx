import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { LumiCharacter, LUMI_ACCENT } from "./LumiCharacter";
import type { CoachMood } from "@/lib/coach/coach";

/**
 * LUMI — el coach/guía de aprendizaje. Aparece en la pantalla principal con una nube
 * de diálogo que sugiere el siguiente paso (anti-grindeo + rumbo guiado).
 * El personaje (con sus 4 expresiones) vive en <LumiCharacter/>.
 */
export function Lumi({
  mood,
  message,
  cta,
}: {
  mood: CoachMood;
  message: string;
  cta: { label: string; href: string } | null;
}) {
  const accent = LUMI_ACCENT[mood];

  return (
    <GlassCard
      strong
      className="p-4 mb-4 border"
      style={{
        borderColor: `${accent}55`,
        background: `radial-gradient(ellipse at 0% 0%, ${accent}1a 0%, transparent 60%)`,
      }}
    >
      <div className="flex items-center gap-4">
        <LumiCharacter mood={mood} size={150} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: accent }}>
            Lumi
          </div>
          <p className="text-base leading-snug mb-3">{message}</p>
          {cta && (
            <Link href={cta.href}>
              <NeonButton variant="primary" size="sm">
                {cta.label} →
              </NeonButton>
            </Link>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
