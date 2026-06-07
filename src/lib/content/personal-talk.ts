/**
 * "HÁBLAME DE TI" — actividad de speaking personalizada.
 *
 * Lumi le hace al niño una pregunta sobre su vida real (hobbies, familia, gustos) y el
 * niño habla 30-60s. Aprovecha el diferenciador del producto: Lumi "conoce" al alumno.
 * Genera la pregunta SIN IA (curada + datos del perfil) → rápido, confiable y gratis.
 * La evaluación reutiliza el endpoint del Diario Hablado.
 */

export interface TalkPrompt {
  prompt_en: string;
  prompt_es: string;
  bullet_ideas: string[];
}

const GENERIC: TalkPrompt[] = [
  {
    prompt_en: "Tell me about your family. Who do you live with, and what are they like?",
    prompt_es: "Cuéntame de tu familia. ¿Con quién vives y cómo son?",
    bullet_ideas: ["Who is in your family", "What they like doing", "Something fun you do together"],
  },
  {
    prompt_en: "What did you do last weekend? Tell me about it.",
    prompt_es: "¿Qué hiciste el fin de semana pasado? Cuéntame.",
    bullet_ideas: ["Where you went", "Who you were with", "What you liked most"],
  },
  {
    prompt_en: "Tell me about your best friend. What do you like doing together?",
    prompt_es: "Háblame de tu mejor amigo/a. ¿Qué les gusta hacer juntos?",
    bullet_ideas: ["Their name and age", "How you met", "What you do together"],
  },
  {
    prompt_en: "What do you want to be when you grow up? Why?",
    prompt_es: "¿Qué quieres ser cuando seas grande? ¿Por qué?",
    bullet_ideas: ["The job you dream of", "Why you like it", "What you would do"],
  },
  {
    prompt_en: "Describe your favorite place. Why do you like it?",
    prompt_es: "Describe tu lugar favorito. ¿Por qué te gusta?",
    bullet_ideas: ["Where it is", "What it looks like", "How you feel there"],
  },
  {
    prompt_en: "What is your favorite food? When and how do you eat it?",
    prompt_es: "¿Cuál es tu comida favorita? ¿Cuándo y cómo la comes?",
    bullet_ideas: ["The food", "Who makes it", "Why you love it"],
  },
  {
    prompt_en: "Describe a normal day for you, from morning to night.",
    prompt_es: "Describe un día normal tuyo, de la mañana a la noche.",
    bullet_ideas: ["Your morning", "School or activities", "Your evening"],
  },
];

function hobbyPrompt(hobbies: string): TalkPrompt {
  const h = hobbies.trim();
  return {
    prompt_en: `I know you like ${h}! Tell me more — what do you do, and why do you enjoy it?`,
    prompt_es: `¡Sé que te gusta ${h}! Cuéntame más: ¿qué haces y por qué te gusta?`,
    bullet_ideas: ["What you do exactly", "When you started", "Why it is special to you"],
  };
}

/**
 * Elige una pregunta personalizada. Si el perfil tiene hobbies, la primera opción
 * (seed 0) es la personalizada; el resto rota por el `seed`.
 */
export function buildPersonalTalkPrompt(input: { hobbies?: string | null; seed?: number }): TalkPrompt {
  const seed = input.seed ?? 0;
  const list = input.hobbies?.trim() ? [hobbyPrompt(input.hobbies), ...GENERIC] : [...GENERIC];
  const i = ((seed % list.length) + list.length) % list.length;
  return list[i];
}
