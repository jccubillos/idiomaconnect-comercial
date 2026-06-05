/**
 * Listening-mode content generators:
 *   - Minimal pairs (e.g. "ship/sheep")
 *   - Listen-and-ID cards (word → pick meaning)
 *   - Shadow speaking phrases (short phrases to repeat)
 *   - Memory match pairs
 */

import { z } from "zod";
import { getGroqClient, GROQ_MODELS } from "./client";
import type { KidPromptInput } from "./prompts";

// ── Minimal pairs ─────────────────────────────────────────
const MinimalPairSchema = z.object({
  a: z.string(),
  b: z.string(),
  feature: z.string(),       // e.g. "/i/ vs /iː/"
  meaning_a: z.string(),
  meaning_b: z.string(),
});
export const MinimalPairsSchema = z.object({ pairs: z.array(MinimalPairSchema).min(4).max(8) });
export type MinimalPair = z.infer<typeof MinimalPairSchema>;

export async function generateMinimalPairs(kid: KidPromptInput) {
  const system = `Genera 6 pares mínimos en inglés conocidos por ser difíciles para hispanohablantes (${kid.cefrCode}).

Cada par: dos palabras que solo difieren en un sonido (ship/sheep, beach/bitch, live/leave, etc.).
- 'a' y 'b': las dos palabras.
- 'feature': el sonido que cambia, p.ej. "/ɪ/ vs /iː/" o "th vs t".
- 'meaning_a' y 'meaning_b': traducción al español de cada una.

Responde SOLO JSON: { "pairs": [...] }`;
  return runJson(system, "Generar pares ahora.", MinimalPairsSchema);
}

// ── Listen ID ─────────────────────────────────────────────
const ListenIdItemSchema = z.object({
  word: z.string(),
  correct_es: z.string(),
  distractors_es: z.array(z.string()).length(3),
});
export const ListenIdSchema = z.object({ items: z.array(ListenIdItemSchema).min(5).max(10) });
export type ListenIdItem = z.infer<typeof ListenIdItemSchema>;

export async function generateListenIdItems(kid: KidPromptInput, count: number) {
  const system = `Genera ${count} palabras o frases cortas en inglés para que ${kid.name} (${kid.cefrCode}) las identifique por sonido.

Cada item:
- 'word': palabra o frase corta en inglés (max 3 palabras).
- 'correct_es': significado en español.
- 'distractors_es': 3 traducciones plausibles pero incorrectas.

Foco: vocabulario apropiado al nivel ${kid.cefrCode}. Hobbies: ${kid.hobbies ?? "varios"}.

Responde SOLO JSON: { "items": [...] }`;
  return runJson(system, `Generar ${count} ítems.`, ListenIdSchema);
}

// ── Shadow phrases ────────────────────────────────────────
const ShadowPhraseSchema = z.object({
  phrase: z.string(),
  pronunciation: z.string().optional(),
  translation: z.string(),
});
export const ShadowSchema = z.object({ phrases: z.array(ShadowPhraseSchema).min(5).max(8) });
export type ShadowPhrase = z.infer<typeof ShadowPhraseSchema>;

export async function generateShadowPhrases(kid: KidPromptInput) {
  const system = `Genera 6 frases cortas en inglés (5-10 palabras) para que ${kid.name} (${kid.cefrCode}) las repita en shadow-speaking.

Foco: ritmo, conexión de palabras, sonidos difíciles para hispanohablantes.
- 'phrase': la frase.
- 'pronunciation' (opcional): pronunciación aproximada con corchetes.
- 'translation': al español.

Responde SOLO JSON: { "phrases": [...] }`;
  return runJson(system, "Generar frases.", ShadowSchema);
}

// ── Memory match pairs ────────────────────────────────────
const MemoryPairSchema = z.object({
  word_en: z.string(),
  word_es: z.string(),
});
export const MemorySchema = z.object({ pairs: z.array(MemoryPairSchema).min(6).max(8) });
export type MemoryPair = z.infer<typeof MemoryPairSchema>;

export async function generateMemoryPairs(kid: KidPromptInput) {
  const system = `Genera 6 pares de vocabulario para un juego tipo concentración. Nivel ${kid.cefrCode}.

Cada par: una palabra en inglés y su traducción exacta al español. No repitas palabras.
Vocabulario del mundo: hobbies / cotidiano. Hobbies del alumno: ${kid.hobbies ?? "general"}.

Responde SOLO JSON: { "pairs": [...] }`;
  return runJson(system, "Generar pares.", MemorySchema);
}

// ── Shared JSON helper ────────────────────────────────────
async function runJson<T extends z.ZodType>(
  system: string,
  user: string,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; error: string }> {
  try {
    const groq = getGroqClient();
    const r = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = r.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.trim().replace(/^```json/i, "").replace(/```$/, "").trim());
    const result = schema.safeParse(parsed);
    if (!result.success) return { ok: false, error: "JSON inválido" };
    return { ok: true, data: result.data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
