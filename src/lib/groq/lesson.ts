/**
 * Lesson generation — calls Groq with JSON mode, validates output,
 * returns a typed result or a structured error.
 *
 * Port of `generate_lesson_and_quiz()` from main(3).py with stricter typing.
 */

import { z } from "zod";
import { getGroqClient, GROQ_DEFAULTS, GROQ_MODELS } from "./client";
import { buildLessonSystemPrompt, type KidPromptInput, type WorldPromptInput } from "./prompts";

const MCQuestionSchema = z.object({
  q: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  answer: z.string().min(1),
});

const FITBQuestionSchema = z.object({
  sentence: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().min(1),
});

export const LessonSchema = z.object({
  title: z.string().min(1),
  academic_topic: z.string().min(1),
  lesson: z.string().min(50),
  mc: z.array(MCQuestionSchema).min(3).max(10),
  fitb: z.array(FITBQuestionSchema).min(3).max(8),
});

export type LessonPayload = z.infer<typeof LessonSchema>;
export type MCQuestion = z.infer<typeof MCQuestionSchema>;
export type FITBQuestion = z.infer<typeof FITBQuestionSchema>;

export type LessonResult =
  | { ok: true; data: LessonPayload; tokensUsed: number }
  | { ok: false; error: string; code: "rate_limit" | "timeout" | "validation" | "unknown" };

export async function generateLesson(args: {
  kid: KidPromptInput;
  world: WorldPromptInput;
  topic: string;
  customContext?: string | null;
}): Promise<LessonResult> {
  const { kid, world, topic, customContext } = args;
  const groq = getGroqClient();
  const system = buildLessonSystemPrompt(kid, world);

  const safeTopic = (topic || "Aventura Diaria").trim().slice(0, 300);
  const safeCustom = customContext?.trim().slice(0, 500);

  let user = `El tema de la lección de hoy es: ${safeTopic}.`;
  if (safeCustom) user += ` Contexto adicional: '${safeCustom}'. Adapta lección y quiz a este tema.`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: GROQ_DEFAULTS.temperature,
      max_tokens: GROQ_DEFAULTS.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const cleaned = raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return {
        ok: false,
        code: "validation",
        error: "El modelo no devolvió JSON válido. Intenta de nuevo.",
      };
    }

    const result = LessonSchema.safeParse(parsed);
    if (!result.success) {
      return {
        ok: false,
        code: "validation",
        error: `JSON incompleto: ${result.error.errors[0]?.message}`,
      };
    }

    return {
      ok: true,
      data: result.data,
      tokensUsed: response.usage?.total_tokens ?? 0,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();
    if (lower.includes("rate_limit") || lower.includes("429")) {
      return { ok: false, code: "rate_limit", error: "Límite de API alcanzado. Espera un momento." };
    }
    if (lower.includes("timeout") || lower.includes("connection")) {
      return { ok: false, code: "timeout", error: "Error de conexión con Groq." };
    }
    console.error("[generateLesson] unexpected", err);
    return { ok: false, code: "unknown", error: `Error inesperado: ${msg}` };
  }
}
