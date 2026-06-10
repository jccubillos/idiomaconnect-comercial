/**
 * MOTOR DE CADENCIAS — reglas de correos del ciclo de vida (decididas por JC).
 *
 *  · post_trial      : terminó el trial sin comprar → cada 2 días ×15, luego cada 7 días ×8.
 *  · dunning_family  : falla de pago familiar → cada 2 días, máx 15 (datos 30 días).
 *  · dunning_school  : falla de pago colegio  → cada 2 días, máx 30 (datos 180 días).
 *  · offer15         : 1 solo correo (felicitación + 15% anual) si ganó ≥200 XP o subió de nivel.
 *
 * Lógica pura (sin DB) para poder testearla: el cron diario consulta el email_log
 * y pregunta aquí "¿toca enviar hoy?".
 */

export interface SequenceSpec {
  /** Cada cuántos días va la fase 1. */
  phase1Every: number;
  /** Cuántos correos tiene la fase 1. */
  phase1Max: number;
  /** Fase 2 opcional (ej. post-trial pasa de cada 2 días a cada 7). */
  phase2Every?: number;
  phase2Max?: number;
}

export const SEQUENCES: Record<"post_trial" | "dunning_family" | "dunning_school", SequenceSpec> = {
  post_trial: { phase1Every: 2, phase1Max: 15, phase2Every: 7, phase2Max: 8 },
  dunning_family: { phase1Every: 2, phase1Max: 15 },
  dunning_school: { phase1Every: 2, phase1Max: 30 },
};

/** Días de retención de datos antes de la purga definitiva. */
export const RETENTION_DAYS = {
  trial: 30,   // trial vencido sin compra
  family: 30,  // falla de pago familiar
  school: 180, // falla de pago institucional
} as const;

const DAY_MS = 86_400_000;

/**
 * ¿Corresponde enviar HOY el siguiente correo de la secuencia?
 *
 * @param spec       La secuencia (cadencia y máximos).
 * @param sentCount  Cuántos correos de esta secuencia ya se enviaron.
 * @param lastSentAt Fecha del último enviado (null si ninguno).
 * @param anchor     Evento que inicia la secuencia (fin del trial / falla de pago).
 * @param now        Fecha actual.
 */
export function emailDue(
  spec: SequenceSpec,
  sentCount: number,
  lastSentAt: Date | null,
  anchor: Date,
  now: Date,
): boolean {
  const totalMax = spec.phase1Max + (spec.phase2Max ?? 0);
  if (sentCount >= totalMax) return false;
  if (now.getTime() < anchor.getTime()) return false;
  if (!lastSentAt) return true;
  const every = sentCount < spec.phase1Max ? spec.phase1Every : (spec.phase2Every ?? spec.phase1Every);
  return now.getTime() - lastSentAt.getTime() >= every * DAY_MS;
}

/** ¿Ya venció el período de retención? (purga definitiva de datos) */
export function purgeDue(kind: keyof typeof RETENTION_DAYS, anchor: Date, now: Date): boolean {
  return now.getTime() - anchor.getTime() >= RETENTION_DAYS[kind] * DAY_MS;
}

/** Fecha límite de retención (para mostrarla en los correos). */
export function retentionDeadline(kind: keyof typeof RETENTION_DAYS, anchor: Date): Date {
  return new Date(anchor.getTime() + RETENTION_DAYS[kind] * DAY_MS);
}

/** ¿Califica para la oferta 15%? (≥200 XP o subió de nivel durante el trial) */
export function qualifiesForOffer(kids: Array<{ total_xp: number; cefr_level: string }>): boolean {
  return kids.some((k) => k.total_xp >= 200 || k.cefr_level !== "A1");
}
