import { LumiCharacter } from "./LumiCharacter";
import type { CoachMood } from "@/lib/coach/coach";

/**
 * Celebración de Lumi para las pantallas de resultado/fin de actividad.
 * - Por defecto celebra con confeti.
 * - Si se pasa `score` (0-100) y es < 60, Lumi anima (pulgar arriba) en vez de celebrar.
 * - Se puede forzar el `mood` explícitamente.
 */
export function LumiCelebration({
  score,
  mood,
  size = 140,
  className = "mb-4",
}: {
  score?: number | null;
  mood?: CoachMood;
  size?: number;
  className?: string;
}) {
  const resolved: CoachMood = mood ?? (score != null && score < 60 ? "encourage" : "celebrate");
  return (
    <div className={`flex justify-center ${className}`}>
      <LumiCharacter mood={resolved} size={size} />
    </div>
  );
}
