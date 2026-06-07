/**
 * EL CEREBRO DE LUMI — el coach de aprendizaje.
 *
 * Función pura (sin DB, fácil de testear) que, a partir de las sesiones del niño,
 * decide:
 *   1. La "Misión del Día": 3 tareas VARIADAS (distintas habilidades) sesgadas hacia
 *      las habilidades más descuidadas + el repaso espaciado pendiente. Esto ataca el
 *      problema del "grindeo" (hacer solo una actividad favorita).
 *   2. El mensaje de Lumi (la nube de diálogo) + a qué actividad apunta su botón.
 *
 * Es la Fase 1 de la "guía de aprendizaje" (Opción D). No requiere cambios de esquema:
 * la Misión se calcula de forma determinista por día y la finalización se infiere de
 * las sesiones de HOY.
 */

import type { CEFRLevel, Skill } from "@/lib/supabase/database.types";
import {
  computeStreakDays,
  computeSkillBreakdown,
  type LessonSessionRow,
} from "@/lib/pedagogy/stats";

const CEFR_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ALL_SKILLS: Skill[] = ["vocabulary", "grammar", "listening", "speaking", "writing", "reading"];
const MISSION_SIZE = 3;

export type CoachMood = "greet" | "suggest" | "encourage" | "celebrate";

export interface CoachActivity {
  id: string;
  skill: Skill | "review";
  label: string;
  emoji: string;
  world: string;
  route: string;
  minCefr: CEFRLevel;
}

export interface CoachTask extends CoachActivity {
  href: string;
  done: boolean;
}

export interface CoachPlan {
  mission: { tasks: CoachTask[]; doneCount: number; total: number };
  lumi: {
    mood: CoachMood;
    message: string;
    cta: { label: string; href: string } | null;
  };
  streak: number;
}

export interface CoachInput {
  kidId: string;
  kidName: string;
  cefrCode: CEFRLevel;
  sessions: LessonSessionRow[];
  srsDueCount: number;
  /** Inyectable para tests; por defecto "ahora". */
  now?: Date;
}

/**
 * Catálogo curado de actividades recomendables, una o más por habilidad.
 * `minCefr` evita sugerir actividades bloqueadas (ej: escritura/diario son A2+).
 */
const CATALOG: CoachActivity[] = [
  { id: "vocab_flash", skill: "vocabulary", label: "Practica vocabulario", emoji: "🃏", world: "vocab", route: "flashcards", minCefr: "A1" },
  { id: "vocab_battle", skill: "vocabulary", label: "Battle de palabras", emoji: "⚔️", world: "vocab", route: "battle", minCefr: "A1" },
  { id: "grammar_lesson", skill: "grammar", label: "Lección de gramática", emoji: "📖", world: "grammar", route: "lesson", minCefr: "A1" },
  { id: "grammar_build", skill: "grammar", label: "Arma oraciones", emoji: "🧩", world: "grammar", route: "sentence-builder", minCefr: "A1" },
  { id: "listen_id", skill: "listening", label: "Escucha e identifica", emoji: "👂", world: "sound", route: "listen-id", minCefr: "A1" },
  { id: "listen_pairs", skill: "listening", label: "Distingue sonidos", emoji: "🎧", world: "sound", route: "minimal-pairs", minCefr: "A1" },
  { id: "speak_pron", skill: "speaking", label: "Pronunciación", emoji: "🎤", world: "sound", route: "pronunciation", minCefr: "A1" },
  { id: "read_story", skill: "reading", label: "Historia con huecos", emoji: "📜", world: "grammar", route: "story-fill", minCefr: "A1" },
  // A2+
  { id: "write_translate", skill: "writing", label: "Traduce al inglés", emoji: "🔁", world: "writing", route: "translate-inverse", minCefr: "A2" },
  { id: "write_scene", skill: "writing", label: "Describe la escena", emoji: "🖼", world: "writing", route: "describe-scene", minCefr: "A2" },
  { id: "speak_journal", skill: "speaking", label: "Diario hablado", emoji: "📔", world: "journal", route: "speaking-journal", minCefr: "A2" },
];

const REVIEW_ACTIVITY: CoachActivity = {
  id: "srs_review",
  skill: "review",
  label: "Repaso del día",
  emoji: "🔁",
  world: "vocab",
  route: "srs",
  minCefr: "A1",
};

function cefrAllows(kid: CEFRLevel, min: CEFRLevel): boolean {
  return CEFR_ORDER.indexOf(kid) >= CEFR_ORDER.indexOf(min);
}

/** Hash determinista (FNV-1a) → entero estable para un mismo string. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function hrefFor(a: CoachActivity, kidId: string): string {
  return `/${a.route}?kid=${kidId}&world=${a.world}`;
}

/**
 * Construye la Misión del Día: hasta 3 tareas de habilidades DISTINTAS, priorizando
 * el repaso pendiente y las habilidades menos practicadas (anti-grindeo). Determinista
 * por día+niño (estable durante todo el día, varía día a día).
 */
function buildMission(
  input: CoachInput,
  breakdown: Record<string, { sessions: number }>,
  seed: number,
): CoachActivity[] {
  const allowed = CATALOG.filter((a) => cefrAllows(input.cefrCode, a.minCefr));
  const chosen: CoachActivity[] = [];
  const usedSkills = new Set<string>();

  // 1. El repaso espaciado es lo de mayor valor pedagógico: va primero si hay pendientes.
  if (input.srsDueCount > 0) {
    chosen.push(REVIEW_ACTIVITY);
    usedSkills.add("review");
  }

  // 2. Habilidades ordenadas por descuido (menos sesiones primero); empate determinista.
  const skillsByNeglect = ALL_SKILLS.filter((sk) => allowed.some((a) => a.skill === sk)).sort(
    (a, b) => {
      const na = breakdown[a]?.sessions ?? 0;
      const nb = breakdown[b]?.sessions ?? 0;
      if (na !== nb) return na - nb;
      return (hashSeed(a + seed) % 1000) - (hashSeed(b + seed) % 1000);
    },
  );

  for (const sk of skillsByNeglect) {
    if (chosen.length >= MISSION_SIZE) break;
    if (usedSkills.has(sk)) continue;
    const acts = allowed.filter((a) => a.skill === sk);
    chosen.push(acts[seed % acts.length]);
    usedSkills.add(sk);
  }

  return chosen.slice(0, MISSION_SIZE);
}

export function getCoachPlan(input: CoachInput): CoachPlan {
  const now = input.now ?? new Date();
  const todayKey = dateKeyUTC(now);
  const seed = hashSeed(todayKey + input.kidId);

  const isToday = (ts: string) => ts.slice(0, 10) === todayKey;
  const practicedToday = input.sessions.some((s) => isToday(s.created_at));

  // La SELECCIÓN de la misión se basa en el historial PREVIO a hoy, para que practicar
  // hoy no reordene la misión (debe ser estable durante todo el día). La finalización
  // (más abajo) sí mira las sesiones de hoy.
  const priorSessions = input.sessions.filter((s) => !isToday(s.created_at));
  const breakdown = computeSkillBreakdown(priorSessions);
  const streak = computeStreakDays(input.sessions, now);

  const activities = buildMission(input, breakdown, seed);
  const tasks: CoachTask[] = activities.map((a) => {
    const done =
      a.skill === "review"
        ? input.sessions.some((s) => isToday(s.created_at) && s.lesson_type === "srs_review")
        : input.sessions.some((s) => isToday(s.created_at) && s.skill === a.skill);
    return { ...a, href: hrefFor(a, input.kidId), done };
  });

  const doneCount = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const firstUndone = tasks.find((t) => !t.done) ?? null;
  const name = input.kidName;

  let mood: CoachMood;
  let message: string;
  let cta: { label: string; href: string } | null = null;

  if (total > 0 && doneCount === total) {
    mood = "celebrate";
    message = `¡Lo lograste, ${name}! Completaste tu misión de hoy 🎉 Ahora explora el mundo que más te guste.`;
  } else if (!practicedToday) {
    mood = streak >= 1 ? "encourage" : "greet";
    const start = firstUndone ? ` Empecemos con ${firstUndone.label} ${firstUndone.emoji}.` : "";
    message =
      streak >= 1
        ? `¡${name}, no pierdas tu racha de ${streak} día${streak === 1 ? "" : "s"}! 🔥${start}`
        : `¡Hola ${name}! Tu plan de hoy te espera.${start}`;
    if (firstUndone) cta = { label: "Empezar", href: firstUndone.href };
  } else {
    mood = "suggest";
    const left = total - doneCount;
    const next = firstUndone ? ` Sigamos con ${firstUndone.label} ${firstUndone.emoji}.` : "";
    message = `¡Buen trabajo hoy, ${name}! Te falta${left === 1 ? "" : "n"} ${left} para completar tu misión.${next}`;
    if (firstUndone) cta = { label: "Continuar", href: firstUndone.href };
  }

  return { mission: { tasks, doneCount, total }, lumi: { mood, message, cta }, streak };
}
