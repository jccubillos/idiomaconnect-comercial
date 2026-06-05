/**
 * Sentence Builder + Story Fill generators.
 * Both produce small JSON outputs adapted to CEFR + world.
 */

import { z } from "zod";
import { getGroqClient, GROQ_MODELS } from "./client";
import type { KidPromptInput, WorldPromptInput } from "./prompts";

// ───────────────────────────────────────────
// Sentence Builder
// ───────────────────────────────────────────
const SBItemSchema = z.object({
  sentence_en: z.string().min(1),
  translation_es: z.string().min(1),
});
export const SentenceBuilderSchema = z.object({
  items: z.array(SBItemSchema).min(4).max(8),
});

export type SBItem = z.infer<typeof SBItemSchema>;

export async function generateSentencesToOrder(args: {
  kid: KidPromptInput;
  world: WorldPromptInput;
  count: number;
}): Promise<{ ok: true; items: SBItem[] } | { ok: false; error: string }> {
  const { kid, world, count } = args;
  const system = `Genera ${count} oraciones simples en inglés para que ${kid.name} (nivel ${kid.cefrCode})
las arme reordenando piezas.

REGLAS:
- 4 a 8 palabras por oración. NO subordinadas anidadas.
- Vocabulario apropiado al nivel ${kid.cefrCode} y al mundo: ${world.name} — ${world.tagline}.
- 'sentence_en': la oración correcta en inglés, con puntuación normal.
- 'translation_es': traducción exacta al español.

Responde SOLO JSON: { "items": [{"sentence_en":"...","translation_es":"..."}] }`;
  try {
    const groq = getGroqClient();
    const r = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.5,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Generar ${count} oraciones.` },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content?.trim().replace(/^```json/i, "").replace(/```$/, "") ?? "");
    const result = SentenceBuilderSchema.safeParse(parsed);
    if (!result.success) return { ok: false, error: "JSON inválido" };
    return { ok: true, items: result.data.items };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

// ───────────────────────────────────────────
// Story Fill (cloze)
// ───────────────────────────────────────────
const ClozeSchema = z.object({
  title: z.string(),
  story_template: z.string().min(50),
  blanks: z.array(z.object({
    answer: z.string().min(1),
    hint: z.string().optional(),
  })).min(3).max(8),
});

export type StoryFill = z.infer<typeof ClozeSchema>;

export async function generateStoryFill(args: {
  kid: KidPromptInput;
  world: WorldPromptInput;
}): Promise<{ ok: true; story: StoryFill } | { ok: false; error: string }> {
  const { kid, world } = args;
  const system = `Genera una historia corta en inglés con huecos para que ${kid.name} (nivel ${kid.cefrCode}) la complete.

REQUISITOS:
- Título corto en español.
- 'story_template': narrativa de 80-150 palabras en inglés con marcadores [[1]] [[2]] [[3]]... donde van las palabras a completar.
- Tema relacionado al mundo: ${world.name} — ${world.tagline}.
- Vocabulario apropiado al nivel ${kid.cefrCode}.
- 'blanks': lista en orden, donde cada item es {"answer": "<palabra correcta minúsculas sin tildes>", "hint": "<pista corta en español>"}.
- Mínimo 3, máximo 8 huecos.

Responde SOLO JSON: {"title":"...","story_template":"...","blanks":[...]}`;
  try {
    const groq = getGroqClient();
    const r = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Generar historia ahora.` },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content?.trim().replace(/^```json/i, "").replace(/```$/, "") ?? "");
    const result = ClozeSchema.safeParse(parsed);
    if (!result.success) return { ok: false, error: "JSON inválido" };
    return { ok: true, story: result.data };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}
