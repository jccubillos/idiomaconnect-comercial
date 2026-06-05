/**
 * Conversation Mode — multi-turn role-play with the LLM.
 *
 * Two endpoints:
 *   - chat: send the kid's latest message + history, get AI's next turn.
 *   - summary: end-of-conversation evaluation against scenario objectives.
 */

import { z } from "zod";
import { getGroqClient, GROQ_MODELS } from "./client";
import type { KidPromptInput } from "./prompts";
import type { ConversationScenario } from "@/lib/content/scenarios";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function buildConversationSystemPrompt(
  kid: KidPromptInput,
  scenario: ConversationScenario,
): string {
  return `Eres ${scenario.aiPersona}. Estás conversando en INGLÉS con ${kid.name},
un/a niño/a de ${kid.ageDesc} con nivel ${kid.cefrCode} (${kid.cefrName}).

ESCENARIO: ${scenario.setting}
EL/LA ALUMNO/A interpreta: ${scenario.kidRole}.

OBJETIVOS de la conversación (verifica que el alumno los cumpla durante el role-play):
${scenario.objectives.map((o) => `- ${o}`).join("\n")}

REGLAS ESTRICTAS:
1. Habla SOLO en inglés. NUNCA escribas en español.
2. Adapta tu vocabulario al nivel ${kid.cefrCode} (oraciones cortas si A1/A2; más complejas si B1+).
3. Responde con UN TURNO a la vez. Una sola pregunta o respuesta natural, máximo 2-3 oraciones.
4. NO corrijas los errores de gramática en medio del role-play (eso lo hace el coach al final).
5. Si el alumno escribe en español o se traba, anímalo en inglés: "Take your time" o "Can you try in English?".
6. Si el alumno cumple un objetivo, suavemente avanza a otro tema relacionado.
7. NUNCA salgas del personaje. NO digas "soy una IA". Mantén el role-play.
8. Sé cálido, paciente y curioso — eres un personaje amistoso.`;
}

export async function conversationChat(args: {
  kid: KidPromptInput;
  scenario: ConversationScenario;
  history: ChatMessage[];
  userMessage: string;
}): Promise<{ ok: true; reply: string; tokensUsed: number } | { ok: false; error: string }> {
  const { kid, scenario, history, userMessage } = args;
  try {
    const groq = getGroqClient();
    const messages: ChatMessage[] = [
      { role: "system", content: buildConversationSystemPrompt(kid, scenario) },
      ...history,
      { role: "user", content: userMessage.trim().slice(0, 800) },
    ];
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.8,
      max_tokens: 200,
      messages,
    });
    const reply = response.choices[0]?.message?.content?.trim() ?? "";
    if (!reply) return { ok: false, error: "Respuesta vacía del modelo" };
    return { ok: true, reply, tokensUsed: response.usage?.total_tokens ?? 0 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const SummarySchema = z.object({
  achieved_objectives: z.array(z.string()),
  missed_objectives: z.array(z.string()),
  fluency_score: z.number().min(0).max(100),
  vocab_score: z.number().min(0).max(100),
  grammar_score: z.number().min(0).max(100),
  feedback: z.string(),
  highlight_phrase: z.string().optional(),
  next_step: z.string().optional(),
});

export type ConversationSummary = z.infer<typeof SummarySchema>;

export async function summarizeConversation(args: {
  kid: KidPromptInput;
  scenario: ConversationScenario;
  history: ChatMessage[];
}): Promise<{ ok: true; data: ConversationSummary } | { ok: false; error: string }> {
  const { kid, scenario, history } = args;
  const transcript = history
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "Student" : "AI"}: ${m.content}`)
    .join("\n");

  const system = `Eres un coach de inglés evaluando una conversación tipo role-play de ${kid.name}
(nivel ${kid.cefrCode}) en el escenario "${scenario.name}".

OBJETIVOS DEL ESCENARIO:
${scenario.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}

Evalúa la conversación y responde SOLO con un JSON con esta forma:

{
  "achieved_objectives": ["..."],
  "missed_objectives": ["..."],
  "fluency_score": 0..100,
  "vocab_score": 0..100,
  "grammar_score": 0..100,
  "feedback": "<feedback corto en español, 2-3 oraciones, cálido y constructivo>",
  "highlight_phrase": "<una frase en inglés que el alumno usó bien (si aplica)>",
  "next_step": "<un consejo concreto para la próxima conversación>"
}`;

  try {
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.chat,
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Transcript:\n${transcript}` },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.trim().replace(/^```json/i, "").replace(/```$/, "").trim());
    const result = SummarySchema.safeParse(parsed);
    if (!result.success) return { ok: false, error: "JSON inválido" };
    return { ok: true, data: result.data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
