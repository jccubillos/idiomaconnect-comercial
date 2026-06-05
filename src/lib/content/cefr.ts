import type { CEFRLevel } from "@/lib/supabase/database.types";

export interface CEFRTier {
  code: CEFRLevel;
  name: string;
  tagline: string;
  threshold: number;
}

export const CEFR_LEVELS: CEFRTier[] = [
  { code: "A1", name: "Explorer", tagline: "Primeros pasos en inglés", threshold: 0 },
  { code: "A2", name: "Cadet", tagline: "Frases cotidianas y rutinas", threshold: 150 },
  { code: "B1", name: "Pilot", tagline: "Conversaciones independientes", threshold: 400 },
  { code: "B2", name: "Captain", tagline: "Fluidez en temas complejos", threshold: 900 },
  { code: "C1", name: "Commander", tagline: "Dominio en contextos académicos", threshold: 1700 },
  { code: "C2", name: "Legend", tagline: "Maestría casi nativa", threshold: 3000 },
];

export interface CEFRInfo extends CEFRTier {
  progress: number; // 0..1 progreso hacia el siguiente nivel
  xpToNext: number;
  nextLabel: string;
}

/** XP umbral de un nivel CEFR (0 si el código no existe). */
export function cefrThreshold(level: CEFRLevel): number {
  return CEFR_LEVELS.find((l) => l.code === level)?.threshold ?? 0;
}

/**
 * XP de "colocación" tras un diagnóstico: nunca baja al alumno.
 * Devuelve el máximo entre su XP actual y el umbral del nivel diagnosticado.
 */
export function placementXp(currentXp: number, level: CEFRLevel): number {
  return Math.max(currentXp, cefrThreshold(level));
}

export function getCefrInfo(totalXp: number): CEFRInfo {
  let currentIdx = 0;
  for (let i = 0; i < CEFR_LEVELS.length; i++) {
    if (totalXp >= CEFR_LEVELS[i].threshold) currentIdx = i;
    else break;
  }

  const current = CEFR_LEVELS[currentIdx];
  const next = CEFR_LEVELS[currentIdx + 1];

  if (!next) {
    return { ...current, progress: 1, xpToNext: 0, nextLabel: "Nivel máximo alcanzado" };
  }

  const span = Math.max(1, next.threshold - current.threshold);
  const progress = Math.max(0, Math.min(1, (totalXp - current.threshold) / span));
  const xpToNext = Math.max(0, next.threshold - totalXp);

  return {
    ...current,
    progress,
    xpToNext,
    nextLabel: `${xpToNext} XP para ${next.code} ${next.name}`,
  };
}
