import { z } from "zod";
import { getGroqClient, GROQ_MODELS } from "./client";
import type { KidPromptInput, WorldPromptInput } from "./prompts";

const CardSchema = z.object({
  word_en: z.string(),
  translation_es: z.string(),
  example: z.string().optional(),
  pronunciation: z.string().optional(),
});

export const FlashcardsSchema = z.object({
  cards: z.array(CardSchema).min(5).max(15),
});

export type Flashcard = z.infer<typeof CardSchema>;

export async function generateFlashcards(args: {
  kid: KidPromptInput;
  world: WorldPromptInput;
  count: number;
}): Promise<{ ok: true; cards: Flashcard[] } | { ok: false; error: string }> {
  const { kid, world, count } = args;
  const system = `Genera ${count} flashcards de vocabulario para ${kid.name}, nivel ${kid.cefrCode}.
Mundo/tema: ${world.name} — ${world.tagline}.

Cada card:
- 'word_en': palabra o frase corta en inglés.
- 'translation_es': traducción al español.
- 'example' (opcional): oración corta usando la palabra.
- 'pronunciation' (opcional): pronunciación aproximada con corchetes.

No repitas palabras. Adecúa la dificultad al nivel ${kid.cefrCode}.

Responde SOLO JSON: { "cards": [...] }`;
  try {
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Generar ${count} cards ahora.` },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.trim().replace(/^```json/i, "").replace(/```$/, "").trim());
    const result = FlashcardsSchema.safeParse(parsed);
    if (!result.success) return { ok: false, error: "JSON inválido" };
    return { ok: true, cards: result.data.cards };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
