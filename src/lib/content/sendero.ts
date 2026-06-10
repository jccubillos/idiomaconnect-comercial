/**
 * SENDERO GUIADO — el camino ordenado sobre la columna vertebral CEFR (34 unidades).
 *
 * Calcula el estado de cada estación a partir del nivel CEFR del niño (por XP) y de
 * cuántas lecciones de gramática (currículo) lleva. No requiere cambios de esquema:
 * el progreso se deriva de datos que ya guardamos.
 *
 * Reglas:
 *  - Unidades de niveles POR DEBAJO del nivel actual → completadas (ya las superó).
 *  - Unidades del nivel ACTUAL → completadas hasta donde llega el conteo; la siguiente
 *    es la "actual"; las demás del nivel quedan "disponibles" (desbloqueadas).
 *  - Unidades de niveles POR ENCIMA → bloqueadas.
 */
import type { CEFRLevel } from "@/lib/supabase/database.types";
import { CURRICULUM, unitsForLevel, type CurriculumUnit } from "./curriculum";

export type StationState = "completed" | "current" | "available" | "locked";

export interface SenderoStation {
  unit: CurriculumUnit;
  index: number; // 0-based dentro de las 34
  number: number; // 1-based para mostrar
  state: StationState;
}

const LEVEL_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function normalizeLevel(level: CEFRLevel): CEFRLevel {
  return level;
}

export function buildSendero(
  currentLevel: CEFRLevel,
  grammarLessonCount: number,
): SenderoStation[] {
  const lvl = normalizeLevel(currentLevel);
  const curLevelIdx = LEVEL_ORDER.indexOf(lvl);
  const unitsInLevel = unitsForLevel(lvl).length;
  // Posición dentro del nivel actual (capada para no "retroceder" al ciclar).
  const inLevelIndex = Math.min(Math.max(0, grammarLessonCount), Math.max(0, unitsInLevel - 1));
  const levelUnits = unitsForLevel(lvl);

  return CURRICULUM.map((unit, i) => {
    const uLevelIdx = LEVEL_ORDER.indexOf(unit.level);
    let state: StationState;
    if (uLevelIdx < curLevelIdx) {
      state = "completed";
    } else if (uLevelIdx > curLevelIdx) {
      state = "locked";
    } else {
      const posInLevel = levelUnits.findIndex((u) => u.id === unit.id);
      if (posInLevel < inLevelIndex) state = "completed";
      else if (posInLevel === inLevelIndex) state = "current";
      else state = "available";
    }
    return { unit, index: i, number: i + 1, state };
  });
}

/** Resumen para mostrar progreso (X de 34, % y la estación actual). */
export function senderoSummary(stations: SenderoStation[]) {
  const total = stations.length;
  const completed = stations.filter((s) => s.state === "completed").length;
  const current = stations.find((s) => s.state === "current") ?? null;
  return {
    total,
    completed,
    pct: total ? Math.round((completed / total) * 100) : 0,
    current,
  };
}
