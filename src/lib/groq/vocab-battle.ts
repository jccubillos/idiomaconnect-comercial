/**
 * Battle mode vocab generator. Asks Groq for N rounds of:
 *   - target word in English
 *   - 4 ES options (1 correct, 3 plausible distractors)
 *
 * Output is small, fast, and avoids the full lesson roundtrip.
 */

import { z } from "zod";
import { getGroqClient, GROQ_MODELS } from "./client";
import type { KidPromptInput, WorldPromptInput } from "./prompts";

const RoundSchema = z.object({
  word_en: z.string().min(1),
  options_es: z.array(z.string()).length(4),
  answer_es: z.string().min(1),
  pronunciation: z.string().optional(),
  example: z.string().optional(),
});

export const BattleSchema = z.object({
  rounds: z.array(RoundSchema).min(6).max(12),
});

export type BattleRound = z.infer<typeof RoundSchema>;
export type BattlePayload = z.infer<typeof BattleSchema>;

export async function generateBattle(args: {
  kid: KidPromptInput;
  world: WorldPromptInput;
  rounds: number;
}): Promise<
  | { ok: true; data: BattlePayload; tokensUsed: number }
  | { ok: false; error: string }
> {
  const { kid, world, rounds } = args;

  const system = `Eres el generador de un mini-juego de combate de vocabulario para ${kid.name},
nivel ${kid.cefrCode} (${kid.cefrName}).
Hobbies: ${kid.hobbies ?? "varios"}. Mundo de la lección: ${world.name} (${world.tagline}).

Tu tarea: genera EXACTAMENTE ${rounds} palabras en inglés apropiadas para el nivel ${kid.cefrCode},
relacionadas con el mundo "${world.name}". Para cada palabra entrega 4 opciones en español
(una correcta + 3 distractores plausibles que un ${kid.cefrCode} confundiría).

Reglas:
- No repitas palabras.
- Las distractoras deben ser semánticamente cercanas (false friends, sinónimos parciales, vocabulario del mismo dominio).
- 'word_en' = una sola palabra o expresión corta (max 3 palabras).
- 'options_es' = 4 strings cortos en español, sin numeración.
- 'answer_es' = texto EXACTO de la opción correcta.
- 'pronunciation' (opcional) = pronunciación aproximada con corchetes, ej: [bá-ter-flai].
- 'example' (opcional) = una oración cortita usando la palabra en inglés.

Responde SOLO con JSON válido:
{
  "rounds": [
    { "word_en": "...", "options_es": ["...","...","...","..."], "answer_es": "...", "pronunciation": "...", "example": "..." }
  ]
}`;

  try {
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Genera ${rounds} rondas ahora.` },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const cleaned = raw.trim().replace(/^```json/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    const result = BattleSchema.safeParse(parsed);
    if (!result.success) {
      return { ok: false, error: `JSON inválido: ${result.error.errors[0]?.message}` };
    }
    return { ok: true, data: result.data, tokensUsed: response.usage?.total_tokens ?? 0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
