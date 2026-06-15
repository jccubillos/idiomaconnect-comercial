/**
 * Generates source prompts for production tasks:
 *   - Speaking Journal: topic for 30-60s free speech
 *   - Translate Inverse: list of Spanish sentences to translate
 *   - Describe Scene: textual scene to describe
 */

import { z } from "zod";
import { getGroqClient, GROQ_MODELS } from "./client";
import type { KidPromptInput } from "./prompts";

// ─ Speaking Journal ────────────────────────────────────────────
const JournalPromptSchema = z.object({
  prompt_en: z.string().min(5),
  prompt_es: z.string().min(5),
  bullet_ideas: z.array(z.string()).min(2).max(5),
});
export type JournalPrompt = z.infer<typeof JournalPromptSchema>;

export async function generateJournalPrompt(kid: KidPromptInput, theme?: string) {
  const themeLine = theme ? `\nTEMA DEL CURSO (úsalo como eje de la consigna): "${theme}".` : "";
  const system = `Genera un tema corto para que ${kid.name} (nivel ${kid.cefrCode}) hable 30-60 segundos en inglés.
Hobbies: ${kid.hobbies ?? "general"}.${themeLine}

- 'prompt_en': pregunta o consigna en inglés (1 oración).
- 'prompt_es': traducción al español.
- 'bullet_ideas': 3-4 pistas breves en español de qué podría decir.

Responde SOLO JSON: { "prompt_en":"...","prompt_es":"...","bullet_ideas":["..."] }`;
  return runJson(system, "Generar prompt ahora.", JournalPromptSchema);
}

// ─ Translate Inverse ───────────────────────────────────────────
const TranslateItemSchema = z.object({
  es: z.string().min(1),
  en_reference: z.string().min(1),
});
const TranslateSchema = z.object({ items: z.array(TranslateItemSchema).min(3).max(8) });
export type TranslateItem = z.infer<typeof TranslateItemSchema>;

export async function generateTranslateItems(kid: KidPromptInput, count: number, theme?: string) {
  const themeLine = theme
    ? `\n- TEMA DEL CURSO: las oraciones deben girar en torno a "${theme}".`
    : "\n- Variedad de tiempos y temas (rutinas, opiniones, planes, descripciones).";
  const system = `Genera ${count} oraciones en español para que ${kid.name} (nivel ${kid.cefrCode})
las traduzca al inglés.

- Oraciones de 5-12 palabras, vocabulario apropiado al nivel.${themeLine}
- 'en_reference': traducción correcta de referencia (puede haber otras válidas).

Responde SOLO JSON: { "items": [{"es":"...","en_reference":"..."}] }`;
  return runJson(system, `Generar ${count} oraciones.`, TranslateSchema);
}

// ─ Describe Scene ──────────────────────────────────────────────
const SceneSchema = z.object({
  scene_es: z.string().min(20),
  scene_en_reference: z.string().min(20),
  key_vocab: z.array(z.string()).min(3).max(8),
});
export type ScenePrompt = z.infer<typeof SceneSchema>;

export async function generateScene(kid: KidPromptInput, theme?: string) {
  const themeLine = theme ? `\nTEMA DEL CURSO (la escena debe estar relacionada): "${theme}".` : "";
  const system = `Genera una escena visual rica para que ${kid.name} (nivel ${kid.cefrCode}) la describa en inglés.${themeLine}

- 'scene_es': descripción visual en español, 3-5 oraciones. Vívida pero apropiada al nivel.
- 'scene_en_reference': descripción modelo en inglés (lo que sería un buen output del alumno).
- 'key_vocab': 4-6 palabras clave en inglés que el alumno podría usar.

Responde SOLO JSON: {"scene_es":"...","scene_en_reference":"...","key_vocab":["..."]}`;
  return runJson(system, "Generar escena ahora.", SceneSchema);
}

// ─ Shared JSON helper ──────────────────────────────────────────
async function runJson<T extends z.ZodType>(
  system: string,
  user: string,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; error: string }> {
  try {
    const groq = getGroqClient();
    const r = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.7,
      max_tokens: 800,
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
