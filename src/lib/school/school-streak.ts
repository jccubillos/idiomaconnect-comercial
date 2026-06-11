import { SCHOOL_WORLD_KEY, SCHOOL_STREAK_MIN_XP } from "@/lib/content/school-world";

/**
 * RACHA DEL COLEGIO — días CONSECUTIVOS en que el alumno entró y ganó al menos
 * 100 XP dentro del mundo "Lumi en tu Colegio" (sesiones world_key='school_world').
 *
 * La racha sigue viva si el último día cumplido es hoy o ayer (hoy aún puede
 * completarse); se corta con un día sin alcanzar el mínimo.
 */

export interface SchoolSessionLite {
  world_key: string | null;
  xp_gained: number | null;
  created_at: string;
}

const DAY_MS = 86_400_000;
const dayKey = (d: Date) => Math.floor(d.getTime() / DAY_MS);

export function computeSchoolStreak(sessions: SchoolSessionLite[], now: Date = new Date()): number {
  // XP por día, solo del mundo del colegio.
  const xpByDay = new Map<number, number>();
  for (const s of sessions) {
    if (s.world_key !== SCHOOL_WORLD_KEY) continue;
    const k = dayKey(new Date(s.created_at));
    xpByDay.set(k, (xpByDay.get(k) ?? 0) + (s.xp_gained ?? 0));
  }

  const today = dayKey(now);
  const met = (k: number) => (xpByDay.get(k) ?? 0) >= SCHOOL_STREAK_MIN_XP;

  // La racha puede anclar en hoy (ya cumplido) o en ayer (hoy aún en curso).
  let anchor: number;
  if (met(today)) anchor = today;
  else if (met(today - 1)) anchor = today - 1;
  else return 0;

  let streak = 0;
  for (let k = anchor; met(k); k--) streak++;
  return streak;
}
