/**
 * CAPA DE VALIDACIÓN de ejercicios.
 *
 * La IA a veces produce preguntas con la respuesta fuera de las opciones,
 * con opciones repetidas (→ "dos respuestas correctas") o con huecos sin clave.
 * Estas funciones filtran esos ejercicios ANTES de mostrarlos al alumno.
 *
 * Se usan sobre tipos estructurales mínimos para no acoplar este módulo a
 * ningún esquema concreto (lesson, battle, etc. comparten la misma forma).
 */

export interface MCLike {
  q: string;
  options: string[];
  answer: string;
}

export interface FITBLike {
  sentence: string;
  answer: string;
}

/** Normaliza para comparar: minúsculas, sin espacios extra ni puntuación final. */
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/, "");
}

/**
 * Una pregunta de opción múltiple es válida solo si:
 *  - tiene al menos 2 opciones, ninguna vacía,
 *  - las opciones son únicas (evita "dos correctas"),
 *  - la respuesta coincide EXACTAMENTE con una sola opción.
 */
export function isValidMC(q: MCLike): boolean {
  if (!q || typeof q.answer !== "string" || !Array.isArray(q.options)) return false;
  const opts = q.options.map((o) => (typeof o === "string" ? o : ""));
  if (opts.length < 2) return false;
  if (opts.some((o) => o.trim() === "")) return false;

  const normed = opts.map(norm);
  if (new Set(normed).size !== normed.length) return false; // opciones repetidas

  const matches = normed.filter((o) => o === norm(q.answer)).length;
  return matches === 1; // la respuesta está exactamente una vez
}

/**
 * Un "fill in the blank" es válido si tiene clave no vacía y un hueco en la oración.
 */
export function isValidFITB(q: FITBLike): boolean {
  if (!q || typeof q.answer !== "string" || typeof q.sentence !== "string") return false;
  if (q.answer.trim() === "") return false;
  return /_{2,}|\.\.\.|…/.test(q.sentence); // ___, ..., o …
}

export function filterValidMC<T extends MCLike>(arr: T[]): T[] {
  return (arr ?? []).filter(isValidMC);
}

export function filterValidFITB<T extends FITBLike>(arr: T[]): T[] {
  return (arr ?? []).filter(isValidFITB);
}
