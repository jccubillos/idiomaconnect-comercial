/**
 * Diagnostic CEFR placement exam.
 * Returns ~18 MC questions sampled across A1→C1, with difficulty tags
 * for placement scoring.
 */

import { z } from "zod";
import { getGroqClient, GROQ_MODELS } from "./client";
import type { KidPromptInput } from "./prompts";

const ExamQuestionSchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  q: z.string(),
  options: z.array(z.string()).length(4),
  answer: z.string(),
  explanation_es: z.string().optional(),
});

export const ExamSchema = z.object({
  questions: z.array(ExamQuestionSchema).min(12).max(20),
});

export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;

export async function generateExam(kid: KidPromptInput) {
  const system = `Genera un examen diagnóstico CEFR para ${kid.name} (currently ${kid.cefrCode}).

REGLAS ESTRICTAS:
- EXACTAMENTE 15 preguntas de opción múltiple.
- Distribución: 3 A1, 3 A2, 3 B1, 3 B2, 3 C1.
- Mezcla gramática y vocabulario.
- 'q': enunciado en inglés con un hueco "___" cuando aplique.
- 'options': 4 opciones, una correcta.
- 'answer': texto exacto de la correcta.
- 'level': el nivel CEFR de la pregunta.
- 'explanation_es' (opcional): por qué es esa la correcta, en español, 1 oración.

Responde SOLO JSON: { "questions": [...] }`;
  try {
    const groq = getGroqClient();
    const r = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.4,
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: "Generar examen ahora." },
      ],
    });
    const raw = r.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.trim().replace(/^```json/i, "").replace(/```$/, "").trim());
    const result = ExamSchema.safeParse(parsed);
    if (!result.success) return { ok: false as const, error: "JSON inválido" };
    return { ok: true as const, questions: result.data.questions };
  } catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; }
}

/**
 * Place the kid based on which levels they reliably solve.
 * Threshold: must answer 2/3 right at a level to "pass" it.
 */
export function placeFromAnswers(
  questions: ExamQuestion[],
  userAnswers: Record<number, string>,
): { suggested: ExamQuestion["level"]; perLevel: Record<string, { right: number; total: number }> } {
  const order: ExamQuestion["level"][] = ["A1", "A2", "B1", "B2", "C1"];
  const perLevel: Record<string, { right: number; total: number }> = {};

  questions.forEach((q, i) => {
    if (!perLevel[q.level]) perLevel[q.level] = { right: 0, total: 0 };
    perLevel[q.level].total += 1;
    if ((userAnswers[i] ?? "").trim() === q.answer.trim()) perLevel[q.level].right += 1;
  });

  let suggested: ExamQuestion["level"] = "A1";
  for (const lvl of order) {
    const data = perLevel[lvl];
    if (data && data.total > 0 && data.right / data.total >= 2 / 3) suggested = lvl;
    else break;
  }
  return { suggested, perLevel };
}
