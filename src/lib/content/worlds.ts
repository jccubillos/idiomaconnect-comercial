/**
 * Mundos de aprendizaje. Cada kid_profile tiene:
 *   - 6 "universal worlds" (compartidos, definidos aquí)
 *   - 1 "personal world" (generado a partir de hobbies del kid)
 *
 * En la DB solo guardamos la `current_world` key (string).
 * El topic se inyecta al prompt en runtime.
 */

export interface UniversalWorld {
  key: string;
  emoji: string;
  name: string;
  tagline: string;
  intro: string;
  accent: string;
  topic: string;
  /** Nivel CEFR mínimo (default A1). */
  minCefr?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

export const UNIVERSAL_WORLDS: UniversalWorld[] = [
  {
    key: "london_hub",
    emoji: "🇬🇧",
    name: "London Hub",
    tagline: "Travel & Daily English",
    intro: "Empieza tu viaje en Londres: pedir café, tomar el tube y conocer gente.",
    accent: "#00eefc",
    topic:
      "Inglés cotidiano para viajes y rutinas: saludos, presentaciones, pedir comida, direcciones, transporte.",
  },
  {
    key: "grammar",
    emoji: "🌌",
    name: "Galaxia Gramatical",
    tagline: "Reglas, estructuras y patrones del inglés",
    intro:
      "Bienvenido al sector galáctico de la gramática. Aquí decodificarás las reglas que rigen el universo del idioma inglés.",
    accent: "#c464ff",
    topic: "Aventura Diaria (reglas gramaticales divertidas y estructuradas).",
  },
  {
    key: "vocab",
    emoji: "📚",
    name: "Bóveda de Vocabulario",
    tagline: "Palabras nuevas, adjetivos, objetos cotidianos",
    intro:
      "Has accedido a la cámara acorazada de palabras. Cada misión expande tu inventario lingüístico con vocabulario práctico.",
    accent: "#00eefc",
    topic:
      "Vocabulario práctico: palabras nuevas, adjetivos, objetos de la casa, direcciones (arriba/abajo), verbos de acción simple. Sin gramática compleja, foco 100% en ampliar vocabulario y mostrar significados.",
  },
  {
    key: "sound",
    emoji: "🎙",
    name: "Estudio de Sonido",
    tagline: "Escucha, distingue y pronuncia sonidos del inglés",
    intro:
      "Entrena tu oído y tu voz: los sonidos que los hispanohablantes confunden, pares mínimos y pronunciaciones difíciles.",
    accent: "#39ff14",
    topic:
      "Pronunciación y comprensión auditiva: sonidos difíciles (th, r final, i/ee), pares mínimos, palabras de uso cotidiano para entrenar oído y voz.",
  },
  {
    key: "chat",
    emoji: "💬",
    name: "Café Conversación",
    tagline: "Role-play con misiones reales",
    intro:
      "Elige un escenario real (pedir comida, viajar, conocer gente) y completa misiones conversando con la IA.",
    accent: "#c464ff",
    topic:
      "Conversación práctica en situaciones cotidianas: restaurantes, viajes, escuela, presentaciones, opiniones simples.",
  },
  {
    key: "writing",
    emoji: "🖋",
    name: "Taller de Letras",
    tagline: "Traduce, describe y escribe en inglés",
    intro:
      "Tus ideas se vuelven palabras en inglés. La habilidad más exigente: producir texto y recibir feedback línea por línea.",
    accent: "#ff66c4",
    topic:
      "Escritura productiva: traducir oraciones del español al inglés y describir escenas con propias palabras.",
    minCefr: "A2",
  },
  {
    key: "journal",
    emoji: "📔",
    name: "Diario Hablado",
    tagline: "Habla 30 segundos sobre el prompt del día",
    intro:
      "El reto más cercano a hablar inglés real. Habla libre, sin guión, y recibe feedback sobre fluidez, vocabulario y gramática.",
    accent: "#00eefc",
    topic:
      "Producción oral espontánea: hablar 30 segundos sobre un tema cotidiano sin guión preestablecido.",
    minCefr: "A2",
  },
  {
    key: "cyber_tokyo",
    emoji: "🗼",
    name: "Cyber-Tokyo",
    tagline: "Advanced Grammar & Idioms",
    intro: "Bienvenido a la metrópoli neón. Gramática avanzada, idioms y phrasal verbs.",
    accent: "#ff5351",
    topic:
      "Gramática intermedia-avanzada: tiempos perfectos, condicionales, voz pasiva, idioms y phrasal verbs frecuentes.",
    minCefr: "B1",
  },
];

export function getUniversalWorld(key: string): UniversalWorld | undefined {
  return UNIVERSAL_WORLDS.find((w) => w.key === key);
}

/**
 * Mundo "Tema del Colegio" — el alumno indica (por voz o texto) qué está viendo en
 * el colegio y la IA arma una lección + quiz a su medida. Es la función estrella de
 * personalización (heredada del MVP Streamlit: "Misión Personalizada").
 *
 * Vive APARTE de UNIVERSAL_WORLDS porque tiene su propio flujo de entrada
 * (/school → escribir/hablar el tema → /lesson), no el hub de modos genérico.
 */
export const SCHOOL_WORLD = {
  key: "school",
  emoji: "🎒",
  name: "Tema del Colegio",
  tagline: "Trae lo que estás viendo en clase",
  intro:
    "Dime qué estás viendo en el colegio (por voz o texto) y te armo una lección y un quiz a tu medida.",
  accent: "#ffd23f",
} as const;

/**
 * Construye un "personal world" basado en los hobbies del kid.
 * Reemplaza la PERSONAL_WORLDS tabla hardcoded del MVP Streamlit.
 */
export interface PersonalWorld {
  key: "personal";
  emoji: string;
  name: string;
  tagline: string;
  intro: string;
  accent: string;
  topic: string;
}

export function buildPersonalWorld(input: {
  kidName: string;
  hobbies: string | null;
  color: string;
  emoji: string;
}): PersonalWorld {
  const hobbies = (input.hobbies ?? "").trim();
  const topic = hobbies
    ? `Vocabulario y expresiones en inglés relacionadas con los intereses de ${input.kidName}: ${hobbies}. Mezcla siempre 1-2 palabras nuevas del tema con vocabulario cotidiano.`
    : `Mundo personal de ${input.kidName}: usa sus intereses y experiencias del día a día como contexto.`;

  return {
    key: "personal",
    emoji: input.emoji,
    name: `Mundo de ${input.kidName}`,
    // Subtítulo genérico: NUNCA exponer en pantalla el contexto familiar/hobbies
    // (papás, hermanos, dónde vive, etc.). Ese contexto solo alimenta el prompt de la IA.
    tagline: "Aventuras de inglés hechas para ti",
    intro: "Tu mundo personal te espera. Cada misión está tejida con lo que te apasiona.",
    accent: input.color,
    topic,
  };
}
