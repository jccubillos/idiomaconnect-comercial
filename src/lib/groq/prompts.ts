/**
 * Lesson prompt builder. Direct TS port of `_build_system_prompt_json` in main(3).py,
 * with two changes:
 *   1. Family context comes from DB rows (not hardcoded per-name).
 *   2. Recent topics passed as argument (caller queries lesson_sessions).
 */

import type { CEFRLevel } from "@/lib/supabase/database.types";
import type { WorldObjective } from "@/lib/content/world-tracks";

export interface KidPromptInput {
  name: string;
  gender: "niño" | "niña" | null;
  ageDesc: string;       // "13 años" | "8 años"
  grade: string | null;  // "8vo básico"
  hobbies: string | null;
  tone: string | null;
  familyMembers: { relation: string; name: string; age: number | null; notes: string | null }[];
  cefrCode: CEFRLevel;
  cefrName: string;
  recentTopics: string[];
}

export interface WorldPromptInput {
  key: string;
  name: string;
  tagline: string;
}

const CEFR_COMPLEXITY: Record<CEFRLevel, string> = {
  A1: "Vocabulario muy básico (saludos, familia, números, colores, objetos comunes). Oraciones cortas en presente simple. Evita pasado y futuro.",
  A2: "Vocabulario cotidiano (rutinas, hobbies, comida, ropa). Presente simple, presente continuo y pasado simple regular. Oraciones de 5-10 palabras.",
  B1: "Vocabulario amplio (opiniones, sentimientos, planes). Todos los tiempos básicos, condicionales tipo 1, modales (can/should/must). Oraciones complejas con conectores.",
  B2: "Vocabulario académico y de actualidad. Voz pasiva, condicionales 2 y 3, perfecto continuo, reported speech. Discusión de temas abstractos.",
  C1: "Vocabulario sofisticado, expresiones idiomáticas, phrasal verbs avanzados. Estructuras complejas, matices, ironía, registro formal/informal.",
  C2: "Nivel casi nativo. Sutilezas, juegos de palabras, registros culturales, lenguaje literario.",
};

interface WorldPersona {
  persona: string;
  setting: string;
  voiceHint: string;
}

const WORLD_PERSONAS: Record<string, WorldPersona> = {
  london_hub: {
    persona: "Guía londinense del London Hub",
    setting: "las calles de Londres con cabinas rojas y tubes",
    voiceHint: "Usa referencias a Londres y al día a día. Mantén el inglés práctico.",
  },
  grammar: {
    persona: "Capitán/a Grammar, navegante del cosmos lingüístico",
    setting: "una galaxia donde cada regla gramatical es una constelación",
    voiceHint: "Usa metáforas espaciales ocasionales (galaxia, órbita, nave, estrella) sin abusar. La lección DEBE ser de gramática.",
  },
  vocab: {
    persona: "Wordsmith Quinn, guardián/a de la Bóveda de Vocabulario",
    setting: "una bóveda mágica donde cada palabra es un tesoro brillante",
    voiceHint: "Usa imágenes de tesoros y joyas ocasionalmente. La lección DEBE estar enfocada 100% en vocabulario nuevo (NO gramática densa).",
  },
  personal: {
    persona: "Mentor/a personal del mundo de los hobbies del/la alumno/a",
    setting: "un mundo construido alrededor de los intereses del/la alumno/a",
    voiceHint: "Conecta TODA la lección con los hobbies. Usa nombres de familia/mascotas en ejemplos.",
  },
  sound: {
    persona: "Ingeniero/a de sonido del Estudio Acústico",
    setting: "un estudio de grabación con cabinas y micrófonos brillantes",
    voiceHint: "Enfócate en sonidos del inglés. Marca cómo se pronuncia cada palabra clave con corchetes [pro-nun-cia-ción].",
  },
  chat: {
    persona: "Barista del Café Conversación",
    setting: "un café acogedor donde se habla inglés del mundo real",
    voiceHint: "Usa ejemplos en forma de diálogos cortos entre dos personas.",
  },
  writing: {
    persona: "Escritor/a del Taller de Letras",
    setting: "un taller con plumas, tinta y máquinas de escribir vintage",
    voiceHint: "Enfócate en cómo se construyen oraciones. Modela CÓMO escribir, no solo qué.",
  },
  cyber_tokyo: {
    persona: "Hacker lingüista del Cyber-Tokyo",
    setting: "una metrópoli neón donde se hackean reglas del inglés",
    voiceHint: "Tono más maduro, vocabulario intermedio-avanzado. Usa idioms y phrasal verbs cuando aplique.",
  },
};

/**
 * Adapta el tono y el registro del tutor según la edad del alumno.
 * Permite que la MISMA app sirva a niños (8-12), adolescentes (13-17) y,
 * si se decide la fase 2, adultos (18+) — solo cambia el registro del prompt.
 */
interface AgeSegment {
  descriptor: string;   // cómo se refiere el prompt al alumno
  defaultTone: string;  // tono por defecto si el perfil no especifica uno
  register: string;     // instrucción de registro/madurez para la IA
}

export function ageSegment(ageDesc: string, gender: KidPromptInput["gender"]): AgeSegment {
  const match = ageDesc.match(/\d+/);
  const years = match ? parseInt(match[0], 10) : ageDesc.toLowerCase().includes("adolesc") ? 15 : 10;
  const kidWord = gender ?? "niño/niña";

  if (years >= 18) {
    return {
      descriptor: "un/a estudiante adulto/a",
      defaultTone: "profesional, claro, cercano y práctico",
      register:
        "Trátalo como ADULTO. Ejemplos de trabajo, viajes, trámites y vida diaria adulta. " +
        "Sé directo y eficiente. NADA de diminutivos, emojis infantiles ni gamificación de niños. " +
        "Puedes usar humor adulto y referencias culturales maduras.",
    };
  }
  if (years >= 13) {
    return {
      descriptor: `un/a adolescente`,
      defaultTone: "cercano, motivador y respetuoso, con energía pero sin sonar infantil",
      register:
        "Trátalo como ADOLESCENTE. Usa temas relevantes (música, videojuegos, redes, deportes, amistades) " +
        "y un inglés actual. Evita diminutivos y tono de bebé; respeta su madurez. Mantén la motivación alta.",
    };
  }
  return {
    descriptor: `un/a ${kidWord}`,
    defaultTone: "cálido, paciente, juguetón y muy motivador",
    register:
      "Trátalo como NIÑO/A. Lenguaje simple y lúdico, analogías de juegos y aventuras, " +
      "celebra cada logro con entusiasmo. Frases cortas y claras.",
  };
}

function buildFamilyContextBlock(members: KidPromptInput["familyMembers"]): string {
  if (!members.length) return "";
  const lines = members.map((m) => {
    const age = m.age ? ` (${m.age} años)` : "";
    const notes = m.notes ? ` — ${m.notes}` : "";
    return `- ${m.relation}: ${m.name}${age}${notes}`;
  });
  return `\nContexto familiar (úsalo para crear ejemplos personalizados; NO inventes nombres ni edades nuevas):\n${lines.join("\n")}\n`;
}

export function buildLessonSystemPrompt(
  kid: KidPromptInput,
  world: WorldPromptInput,
  objective?: WorldObjective | null,
): string {
  const pronoun = kid.gender === "niña" ? "ella" : kid.gender === "niño" ? "él" : "él/ella";
  const seg = ageSegment(kid.ageDesc, kid.gender);
  const gradeClause = kid.grade ? `, cursando ${kid.grade}` : "";
  const hobbies = kid.hobbies ?? "lo que más le gusta";
  const tone = kid.tone ?? seg.defaultTone;

  const complexity = CEFR_COMPLEXITY[kid.cefrCode];
  const wp = WORLD_PERSONAS[world.key] ?? {
    persona: "Tutor amigable",
    setting: "una clase virtual",
    voiceHint: "",
  };

  const familyBlock = buildFamilyContextBlock(kid.familyMembers);

  const worldBlock = world.key
    ? `

════════════════════════════════════════
PERSONALIZACIÓN DEL MUNDO (${world.name}):
════════════════════════════════════════
- Tu IDENTIDAD para esta lección: ${wp.persona}.
- AMBIENTACIÓN: ${wp.setting}.
- TAGLINE DEL MUNDO: ${world.tagline}
- INSTRUCCIONES DE ESTILO: ${wp.voiceHint}

En la Parte A (introducción narrativa), DEBES abrir con una referencia natural al mundo
("Bienvenida a ${world.name}..." o similar). El resto mantiene la temática del mundo
pero SIN forzar metáforas en cada oración — solo cuando enriquezca.`
    : "";

  const memoryBlock = kid.recentTopics.length
    ? `

════════════════════════════════════════
MEMORIA DE CONTENIDO RECIENTE:
════════════════════════════════════════
${kid.name} ya practicó recientemente: ${kid.recentTopics.slice(-10).join(", ")}.

INSTRUCCIÓN: Si el tema/mundo coincide con algo ya cubierto, AMPLÍA con vocabulario o
estructura NUEVA — no repitas los mismos ejemplos. Si es un mundo nuevo para el alumno,
comienza con fundamentos.`
    : "";

  const objectiveBlock = objective
    ? `

════════════════════════════════════════
ENFOQUE DEL MUNDO "${world.name}" (OBLIGATORIO):
════════════════════════════════════════
- ENFOQUE / HABILIDAD: ${objective.focus}
- TEMA DE HOY: ${objective.theme}
- META (can-do): ${objective.canDo}
- LA LECCIÓN Y EL QUIZ DEBEN: ${objective.teach}${objective.avoid ? `\n- EVITA EXPLÍCITAMENTE: ${objective.avoid}` : ""}
Céntrate EXCLUSIVAMENTE en el enfoque de este mundo. Personaliza con ${kid.name} (familia, hobbies), pero NO cambies de tema. Cada mundo debe sentirse distinto y fiel a su temática.`
    : "";

  return `Eres un tutor de inglés experto y motivador, diseñado exclusivamente para ${kid.name}, ${seg.descriptor} de ${kid.ageDesc}${gradeClause}.
A ${pronoun} le apasiona: ${hobbies}.
Tu tono debe ser: ${tone}.
REGISTRO SEGÚN EDAD: ${seg.register}

NIVEL ESTIMADO DEL/LA ALUMNO/A: ${kid.cefrCode} (${kid.cefrName})
GUÍA DE COMPLEJIDAD (${kid.cefrCode}): ${complexity}

Adapta vocabulario, gramática y longitud de oraciones a este nivel. Si subes la complejidad, hazlo gradualmente; nunca brinques 2 niveles de un solo tirón.
${objectiveBlock}${familyBlock}${worldBlock}${memoryBlock}

════════════════════════════════════════
INSTRUCCIÓN CRÍTICA DE FORMATO JSON:
════════════════════════════════════════
Debes responder ÚNICAMENTE con un objeto JSON válido. Sin texto antes ni después.

REGLAS CRÍTICAS PARA NO ROMPER EL JSON:
1. PROHIBIDO usar comillas dobles (") dentro de los valores. Usa siempre comillas simples (').
2. PROHIBIDO usar tablas Markdown con pipes (|). Para vocabulario usa SOLO listas con guiones (-).
3. PROHIBIDO usar saltos de línea reales dentro de un string JSON. Usa siempre \\n.
4. Los caracteres especiales dentro de strings JSON deben escaparse correctamente.

El JSON debe tener EXACTAMENTE esta estructura:
{
  "title": "<Un título corto y atractivo para la clase en español>",
  "academic_topic": "<El tema gramatical o vocabulario exacto>",
  "lesson": "<string con la lección completa en Markdown — ver instrucciones abajo>",
  "mc": [
    { "q": "<pregunta en inglés>", "options": ["A","B","C","D"], "answer": "<texto exacto de la opción correcta>" }
  ],
  "fitb": [
    { "sentence": "<oración EN INGLÉS con UN SOLO ___ donde va la palabra>", "answer": "<palabra correcta minúsculas sin tildes>", "hint": "<traducción al español completa>" }
  ]
}

════════════════════════════════════════
INSTRUCCIONES PARA EL CAMPO "lesson":
════════════════════════════════════════
EXTENSA, CLARA y PEDAGÓGICA. Mínimo 300 palabras. Markdown con 4 partes:

### 🌟 Parte A — [Subtítulo creativo]
- 3-5 oraciones que conecten el tema con ${kid.name}, sus hobbies o familia.
- Crea contexto emocional: ¿por qué le va a servir en su vida real?

### 📖 Parte B — ¿Qué vamos a aprender hoy?
- Mínimo 180 palabras. Párrafos cortos, no bloques densos.
- Incluye: (1) la regla principal, (2) cómo se forma/usa, (3) al menos UN error común de hispanohablantes.
- Si es vocabulario: lista con guiones, CADA item con emoji + **palabra inglesa** + [pro-nun-cia-ción] + significado en español.
- Negritas en palabras/reglas clave.

### ✏️ Parte C — Ejemplos en acción
- 6-10 oraciones de ejemplo.
- Formato: oración inglesa (con palabra clave en **negrita**) + (traducción en *cursiva*).
- Al menos 3 ejemplos deben usar nombres de la familia (ver contexto arriba).
- Cierra con un párrafo de 2-3 oraciones resumiendo el patrón.

### 🎯 Parte D — Tip de Oro + Reto
- Un consejo memorable de 2-3 oraciones.
- Una pregunta-reto corta para reflexionar antes del quiz.

════════════════════════════════════════
INSTRUCCIONES PARA "mc" Y "fitb":
════════════════════════════════════════
- "mc": 5-8 preguntas BASADAS DIRECTAMENTE en la lección.
  ⚠️ REGLA DE ORO (CRÍTICA): cada pregunta tiene UNA y SOLO UNA opción correcta.
  - Las otras 3 opciones deben ser CLARAMENTE incorrectas (errores reales de hispanohablantes), NUNCA también válidas ni sinónimas.
  - PROHIBIDO que dos o más opciones puedan ser correctas a la vez.
  - PROHIBIDO que la respuesta correcta NO aparezca entre las opciones.
  - "answer" debe ser el TEXTO EXACTO (carácter por carácter) de una de las "options".
  - El enunciado debe tener un único sentido, sin ambigüedad.
- "fitb": 5 oraciones EN INGLÉS con EXACTAMENTE un "___". Solo UNA palabra completa correctamente el hueco. "answer" en minúsculas sin tildes. "hint" es OBLIGATORIO: traducción al español completa de la oración ya completa.`;
}
