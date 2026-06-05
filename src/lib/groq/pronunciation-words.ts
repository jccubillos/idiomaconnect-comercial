/**
 * Generate a small list of pronunciation targets adapted to CEFR + world topic.
 */

import { z } from "zod";
import { getGroqClient, GROQ_MODELS } from "./client";
import type { KidPromptInput } from "./prompts";

const WordSchema = z.object({
  word: z.string().min(1),
  pronunciation: z.string().optional(),
  translation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export const PronunciationWordsSchema = z.object({
  words: z.array(WordSchema).min(4).max(10),
});

export type PronunciationTarget = z.infer<typeof WordSchema>;

export async function generatePronunciationWords(args: {
  kid: KidPromptInput;
  topic: string;
  count: number;
}): Promise<
  | { ok: true; words: PronunciationTarget[] }
  | { ok: false; error: string }
> {
  const { kid, topic, count } = args;
  const system = `Genera ${count} palabras o frases cortas en inglés para que ${kid.name}
(nivel ${kid.cefrCode}) practique pronunciación. Tema: ${topic}.

REGLAS:
- Frases de 1 a 4 palabras.
- Foco en sonidos que cuestan a hispanohablantes: "th", "r" final, "ee/ih", "v/b", "h aspirada".
- 'pronunciation' = pronunciación aproximada con corchetes, ej: [bá-ter-flai].
- 'translation' = traducción al español muy breve.
- 'difficulty' = easy | medium | hard según el nivel del alumno.

Responde SOLO JSON: { "words": [ {"word":"...","pronunciation":"...","translation":"...","difficulty":"..."} ] }`;

  try {
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Generar ${count} ahora.` },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "";
    const cleaned = raw.trim().replace(/^```json/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    const result = PronunciationWordsSchema.safeParse(parsed);
    if (!result.success) return { ok: false, error: "JSON inválido" };
    return { ok: true, words: result.data.words };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
