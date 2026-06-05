/**
 * PISTAS POR MUNDO — hace que cada mundo enseñe contenido DISTINTO y fiel a su tema.
 *
 * Mejora sobre el MVP Streamlit: en vez de un solo "topic" por mundo, cada mundo
 * tiene un ENFOQUE (la habilidad que entrena) + una lista curada de TEMAS que va
 * rotando. La IA adapta la dificultad al nivel CEFR del alumno.
 *
 *  - Mundos de gramática (grammar, cyber_tokyo) → usan la COLUMNA VERTEBRAL (curriculum).
 *  - Mundos temáticos (vocab, sound, chat, writing, london_hub) → su propia pista.
 *  - Mundo personal → todo gira en torno a los hobbies del alumno.
 */
import type { CEFRLevel } from "@/lib/supabase/database.types";
import { pickCurriculumUnit, type CurriculumUnit } from "./curriculum";

export interface WorldObjective {
  focus: string;     // la habilidad/enfoque del mundo (para el prompt)
  theme: string;     // el tema concreto de HOY
  canDo: string;     // descriptor CEFR
  teach: string;     // qué DEBE hacer la lección
  avoid?: string;    // qué debe EVITAR (clave para diferenciar mundos)
}

interface ThemedTrack {
  focus: string;
  canDo: string;
  teach: string;
  avoid?: string;
  themes: string[];
}

const TRACKS: Record<string, ThemedTrack> = {
  vocab: {
    focus: "vocabulario práctico (ampliar palabras, NO gramática)",
    canDo: "Puede reconocer y usar vocabulario nuevo del tema.",
    teach:
      "Enseña 8-12 palabras nuevas del tema con emoji + palabra en inglés + [pronunciación] + significado en español. Muestra cada palabra en una oración simple.",
    avoid: "gramática compleja o densa; explicaciones de reglas. El foco es 100% vocabulario.",
    themes: [
      "la familia y las personas", "la comida y las bebidas", "los animales",
      "la casa y los muebles", "la ropa y los accesorios", "el cuerpo humano",
      "la escuela y los útiles", "la ciudad y los lugares", "los deportes y el tiempo libre",
      "la naturaleza y el clima", "los viajes y el transporte", "las emociones y los sentimientos",
    ],
  },
  sound: {
    focus: "pronunciación y comprensión auditiva (sonidos del inglés)",
    canDo: "Puede distinguir y producir sonidos difíciles del inglés.",
    teach:
      "Enfócate en el sonido objetivo: marca la pronunciación de cada palabra clave con [corchetes], da pares de palabras parecidas (minimal pairs) y un truco para producir el sonido.",
    avoid: "gramática avanzada. El foco es el oído y la voz.",
    themes: [
      "el sonido 'th' (think vs this)", "la i corta vs la ee larga (ship vs sheep)",
      "las consonantes finales (-ed, -s)", "la 'r' inglesa", "la 'b' vs la 'v'",
      "la 'h' aspirada (hat, home)", "las vocales a/e (cat vs bed)",
      "el acento de la palabra (word stress)", "los sonidos de vocales largas (oo, ar)",
      "la entonación de las preguntas",
    ],
  },
  chat: {
    focus: "conversación y role-play en situaciones reales",
    canDo: "Puede mantener un intercambio corto en una situación cotidiana.",
    teach:
      "Construye la lección como un mini diálogo de la situación, con frases útiles (functional language), preguntas y respuestas modelo que el alumno pueda reusar.",
    avoid: "listas largas de gramática abstracta; prioriza frases que se usan al hablar.",
    themes: [
      "saludar y presentarse", "pedir comida en un restaurante", "preguntar direcciones",
      "ir de compras", "hacer planes con amigos", "hablar por teléfono",
      "en el médico", "en el aeropuerto", "dar tu opinión sobre algo",
      "conocer a alguien nuevo",
    ],
  },
  writing: {
    focus: "escritura y producción de texto en inglés",
    canDo: "Puede producir frases y textos cortos por escrito.",
    teach:
      "Modela CÓMO se construye el texto: da un ejemplo escrito, señala la estructura y propone que el alumno escriba el suyo. Incluye conectores útiles.",
    avoid: "ejercicios puramente orales; el foco es escribir.",
    themes: [
      "describir una foto o escena", "escribir sobre tu día", "traducir oraciones del español al inglés",
      "escribir un email corto", "describir a una persona", "contar una anécdota del pasado",
      "escribir tu opinión sobre un tema", "describir tu lugar favorito",
    ],
  },
  london_hub: {
    focus: "inglés situacional para viajar y la vida diaria",
    canDo: "Puede desenvolverse en situaciones prácticas de viaje y rutina.",
    teach:
      "Sitúa la lección en el escenario real: frases clave que se usan ahí, vocabulario del lugar y un mini-diálogo de ejemplo.",
    themes: [
      "en el aeropuerto", "en el hotel", "en el restaurante", "tomar el transporte público",
      "pedir indicaciones en la calle", "en una tienda de ropa", "hacer una reserva",
      "hablar del clima", "presentarse a gente nueva", "una pequeña emergencia",
    ],
  },
};

function fromUnit(u: CurriculumUnit, advanced = false): WorldObjective {
  return {
    focus: advanced
      ? "gramática intermedia-avanzada, idioms y phrasal verbs"
      : "gramática (reglas, estructuras y patrones)",
    theme: `${u.title} — ${u.grammar}`,
    canDo: u.canDo,
    teach: `Enseña a fondo la regla: ${u.grammar}. Usa vocabulario de apoyo: ${u.vocab}.`,
  };
}

function rotate<T>(arr: T[], index: number): T {
  return arr[((index % arr.length) + arr.length) % arr.length];
}

/**
 * Elige el objetivo de la lección SEGÚN EL MUNDO. Esto hace que cada mundo
 * entregue contenido distinto y fiel a su temática.
 */
export function pickWorldObjective(
  worldKey: string,
  level: CEFRLevel,
  index: number,
): WorldObjective {
  if (worldKey === "grammar") return fromUnit(pickCurriculumUnit(level, index));
  if (worldKey === "cyber_tokyo") return fromUnit(pickCurriculumUnit(level, index), true);
  if (worldKey === "personal") {
    return {
      focus: "los intereses y hobbies del alumno",
      theme: "vocabulario y expresiones en inglés sobre lo que te apasiona",
      canDo: "Puede hablar en inglés de sus gustos e intereses.",
      teach: "Conecta TODO el contenido (lección y quiz) con los hobbies del alumno.",
    };
  }
  const t = TRACKS[worldKey];
  if (t) {
    const theme = rotate(t.themes, index);
    return { focus: t.focus, theme, canDo: t.canDo, teach: `${t.teach} TEMA DE HOY: ${theme}.`, avoid: t.avoid };
  }
  // Fallback seguro: currículum de gramática.
  return fromUnit(pickCurriculumUnit(level, index));
}
