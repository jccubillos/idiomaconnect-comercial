/**
 * Spaced Repetition System — SuperMemo SM-2 algorithm.
 * Direct port of the SRS logic in main(3).py (update_srs_card).
 *
 * `quality` is the user's rating of recall:
 *   5 = perfect, 4 = correct w/ hesitation, 3 = correct w/ difficulty,
 *   2 = incorrect — easy to recall, 1 = incorrect — remembered, 0 = blackout
 *
 * Cards with quality < 3 reset to interval=1 and re-show same day.
 */

export interface SrsState {
  intervalDays: number;
  easeFactor: number;
  repetition: number;
  dueAt: Date;
}

export function applySm2(prev: SrsState, quality: number): SrsState {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let ease = prev.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < 1.3) ease = 1.3;

  let repetition: number;
  let intervalDays: number;

  if (q < 3) {
    // Reset
    repetition = 0;
    intervalDays = 1;
  } else {
    repetition = prev.repetition + 1;
    if (repetition === 1) intervalDays = 1;
    else if (repetition === 2) intervalDays = 6;
    else intervalDays = Math.round(prev.intervalDays * ease);
  }

  const now = new Date();
  const dueAt = new Date(now.getTime() + intervalDays * 86_400_000);

  return { intervalDays, easeFactor: ease, repetition, dueAt };
}

export function isDue(card: { dueAt: Date | string }): boolean {
  const t = typeof card.dueAt === "string" ? new Date(card.dueAt) : card.dueAt;
  return t.getTime() <= Date.now();
}
