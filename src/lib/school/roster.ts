/**
 * Agregaciones para los paneles de colegio (profesor / admin).
 * Funciones puras → fáciles de testear, sin dependencias de Supabase.
 */

import { getCefrInfo } from "@/lib/content/cefr";
import { computeStreakDays, type LessonSessionRow } from "@/lib/pedagogy/stats";

export interface StudentSessionLite {
  kid_id: string;
  skill: string | null;
  world_key: string | null;
  lesson_type: string;
  score_pct: number | null;
  xp_gained: number;
  created_at: string;
}

export interface StudentSummary {
  kidId: string;
  totalXp: number;
  cefrCode: string;
  cefrName: string;
  sessions: number;
  avgScore: number;          // 0..100
  streakDays: number;
  lastActive: string | null; // ISO o null
  activeLast7: number;       // sesiones en los últimos 7 días
}

/** Resumen de un alumno a partir de sus sesiones. */
export function summarizeStudent(
  kidId: string,
  totalXp: number,
  sessions: StudentSessionLite[],
  now: Date = new Date(),
): StudentSummary {
  const mine = sessions.filter((s) => s.kid_id === kidId);
  const cefr = getCefrInfo(totalXp);
  const sessionCount = mine.length;
  const scored = mine.filter((s) => s.score_pct != null);
  const avgScore = scored.length
    ? scored.reduce((a, s) => a + (s.score_pct ?? 0), 0) / scored.length
    : 0;
  const sevenAgo = now.getTime() - 7 * 86_400_000;
  const activeLast7 = mine.filter((s) => new Date(s.created_at).getTime() >= sevenAgo).length;
  const lastActive = mine.length
    ? mine.reduce((max, s) => (s.created_at > max ? s.created_at : max), mine[0].created_at)
    : null;

  const asRows: LessonSessionRow[] = mine.map((s) => ({
    lesson_type: s.lesson_type,
    world_key: s.world_key,
    skill: s.skill,
    score_pct: s.score_pct,
    xp_gained: s.xp_gained,
    created_at: s.created_at,
  }));

  return {
    kidId,
    totalXp,
    cefrCode: cefr.code,
    cefrName: cefr.name,
    sessions: sessionCount,
    avgScore: Math.round(avgScore),
    streakDays: computeStreakDays(asRows, now),
    lastActive,
    activeLast7,
  };
}

export interface CourseAggregate {
  students: number;
  activeStudents7: number;     // alumnos con ≥1 sesión en 7 días
  totalSessions: number;
  sessions7: number;
  avgXp: number;
  avgScore: number;            // 0..100
}

/** Agregado del curso completo. */
export function aggregateCourse(
  summaries: StudentSummary[],
  allSessions7Count: number,
  totalSessions: number,
): CourseAggregate {
  const students = summaries.length;
  const activeStudents7 = summaries.filter((s) => s.activeLast7 > 0).length;
  const avgXp = students ? Math.round(summaries.reduce((a, s) => a + s.totalXp, 0) / students) : 0;
  const scored = summaries.filter((s) => s.sessions > 0);
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, s) => a + s.avgScore, 0) / scored.length)
    : 0;
  return {
    students,
    activeStudents7,
    totalSessions,
    sessions7: allSessions7Count,
    avgXp,
    avgScore,
  };
}

/** Etiqueta legible de "última actividad". */
export function lastActiveLabel(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "Nunca";
  const diffDays = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (diffDays <= 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
  return `Hace ${Math.floor(diffDays / 30)} mes(es)`;
}
