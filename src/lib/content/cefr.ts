import type { CEFRLevel } from "@/lib/supabase/database.types";
import { curriculumCapLevel } from "./curriculum";

export interface CEFRTier {
  code: CEFRLevel;
  name: string;
  tagline: string;
  threshold: number;
}

export const CEFR_LEVELS: CEFRTier[] = [
  { code: "A1", name: "Explorer", tagline: "Primeros pasos en inglés", threshold: 0 },
  { code: "A2", name: "Cadet", tagline: "Frases cotidianas y rutinas", threshold: 200 },
  { code: "B1", name: "Pilot", tagline: "Conversaciones independientes", threshold: 450 },
  { code: "B2", name: "Captain", tagline: "Fluidez en temas complejos", threshold: 900 },
  { code: "C1", name: "Commander", tagline: "Dominio en contextos académicos", threshold: 1700 },
  { code: "C2", name: "Legend", tagline: "Maestría casi nativa", threshold: 3000 },
];

/** Tier por código (para mostrar el nombre de un nivel guardado). */
export function cefrTier(code: CEFRLevel): CEFRTier {
  return CEFR_LEVELS.find((l) => l.code === code) ?? CEFR_LEVELS[0];
}

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

export interface EffectiveCefrInfo extends CEFRInfo {
  /** true = tiene el XP del siguiente nivel pero le faltan unidades por completar. */
  blockedByCurriculum: boolean;
}

/**
 * Nivel EFECTIVO con DOBLE EXIGENCIA para ascender: el XP (getCefrInfo) Y haber
 * recorrido todas las unidades del nivel (curriculumCapLevel).
 *
 * Si el alumno tiene XP de sobra pero aún no termina las unidades de su nivel,
 * se queda en el nivel actual (capado) y se le indica que complete las unidades.
 *
 * `floorLevel` (opcional) = piso que la doble exigencia NUNCA baja. Sirve para el
 * examen diagnóstico: un alumno ubicado en B1 (conocimiento probado) no vuelve a A1
 * por no haber hecho las lecciones de gramática. Por encima del piso sí aplica la
 * doble exigencia para seguir subiendo.
 */
export function effectiveCefrInfo(
  totalXp: number,
  grammarLessonsDone: number,
  floorLevel?: CEFRLevel,
): EffectiveCefrInfo {
  const xpInfo = getCefrInfo(totalXp);
  const order = CEFR_LEVELS.map((l) => l.code);
  const xpIdx = order.indexOf(xpInfo.code);

  let capIdx = order.indexOf(curriculumCapLevel(grammarLessonsDone));
  if (floorLevel) capIdx = Math.max(capIdx, order.indexOf(floorLevel));

  const effIdx = Math.min(xpIdx, capIdx);

  if (effIdx >= xpIdx) {
    return { ...xpInfo, blockedByCurriculum: false };
  }

  // Capado por currículo: mostramos el nivel permitido y pedimos completar unidades.
  const tier = CEFR_LEVELS[effIdx];
  return {
    ...tier,
    progress: 1,
    xpToNext: 0,
    nextLabel: "Completa las unidades del nivel para subir",
    blockedByCurriculum: true,
  };
}
