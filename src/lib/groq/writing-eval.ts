/**
 * Generic free-form writing/speaking evaluator. Used by:
 *   - Speaking Journal (transcript of 30-60s speech)
 *   - Translate Inverse (the kid's English translation of an ES sentence)
 *   - Describe Scene (the kid's English description of a scene)
 *
 * Returns a per-skill score + targeted feedback + a corrected version.
 */

import { z } from "zod";
import { getGroqClient, GROQ_MODELS } from "./client";
import type { KidPromptInput } from "./prompts";

const EvalSchema = z.object({
  fluency_score: z.number().min(0).max(100),
  vocab_score: z.number().min(0).max(100),
  grammar_score: z.number().min(0).max(100),
  feedback_es: z.string().min(10),
  corrected_version: z.string(),
  highlight_phrase: z.string().optional(),
});

export type ProductionEval = z.infer<typeof EvalSchema>;

export async function evaluateProduction(args: {
  kid: KidPromptInput;
  taskType: "speaking_journal" | "translate_inverse" | "describe_scene";
  promptOrSource: string;
  userOutput: string;
}): Promise<{ ok: true; data: ProductionEval } | { ok: false; error: string }> {
  const { kid, taskType, promptOrSource, userOutput } = args;

  const taskLabels = {
    speaking_journal: {
      title: "Diario hablado",
      action: "hablar libremente en inglés",
      sourceLabel: "Tema dado",
    },
    translate_inverse: {
      title: "Traducción ES→EN",
      action: "traducir una oración al inglés",
      sourceLabel: "Oración en español",
    },
    describe_scene: {
      title: "Descripción de escena",
      action: "describir una escena en inglés",
      sourceLabel: "Escena dada",
    },
  } as const;
  const label = taskLabels[taskType];

  const system = `Eres un coach de inglés evaluando una tarea de producción libre de ${kid.name},
nivel ${kid.cefrCode} (${kid.cefrName}). Tarea: ${label.title} — debe ${label.action}.

Evalúa el output del alumno. Reglas:
- 'fluency_score' (0-100): qué tan natural y fluido es el texto.
- 'vocab_score' (0-100): variedad y precisión del vocabulario.
- 'grammar_score' (0-100): corrección gramatical.
- 'feedback_es': 2-3 oraciones en español, cálido y constructivo. Apunta a 1-2 errores concretos máximo.
- 'corrected_version': la mejor versión en inglés sin cambiar el sentido. Si el output está bien, repítelo idéntico.
- 'highlight_phrase' (opcional): una frase del alumno que valga la pena celebrar.

Sé generoso pero honesto. Calibra al nivel ${kid.cefrCode}: no esperes vocabulario C1 de un A1.

Responde SOLO con JSON con los campos arriba.`;

  const userMsg = `${label.sourceLabel}: "${promptOrSource}"\n\nOutput del alumno: "${userOutput}"`;

  try {
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.trim().replace(/^```json/i, "").replace(/```$/, "").trim());
    const result = EvalSchema.safeParse(parsed);
    if (!result.success) return { ok: false, error: "JSON inválido" };
    return { ok: true, data: result.data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
