/**
 * COLUMNA VERTEBRAL — Currículum CEFR curado (scope & sequence).
 *
 * Define QUÉ se enseña y en qué orden por nivel (A1→C1), al estilo de un plan
 * de estudios diseñado por profesores expertos. La IA luego personaliza el CÓMO
 * (ejemplos con la familia/hobbies del niño y el tema del mundo). Esto es el
 * núcleo del modelo HÍBRIDO: objetivo curado + entrega personalizada.
 *
 * Cada unidad declara: foco gramatical, vocabulario meta y un "can-do" CEFR.
 */
import type { CEFRLevel } from "@/lib/supabase/database.types";

export interface CurriculumUnit {
  id: string;
  level: CEFRLevel;
  title: string;       // título corto en español
  canDo: string;       // descriptor CEFR "puede…"
  grammar: string;     // foco gramatical exacto a enseñar
  vocab: string;       // campo de vocabulario meta
}

export const CURRICULUM: CurriculumUnit[] = [
  // ───────────────────────────── A1 ─────────────────────────────
  { id: "a1-1", level: "A1", title: "Saludos y presentaciones", canDo: "Puede saludar y presentarse con datos básicos.", grammar: "verbo 'to be' (am/is/are) en afirmativo, negativo y preguntas", vocab: "saludos, nombres, países y nacionalidades, números 1-20" },
  { id: "a1-2", level: "A1", title: "Mi familia", canDo: "Puede describir a su familia.", grammar: "adjetivos posesivos (my/your/his/her) y genitivo sajón ('s)", vocab: "miembros de la familia, edades, adjetivos básicos" },
  { id: "a1-3", level: "A1", title: "Mis cosas", canDo: "Puede nombrar objetos y describir cantidades simples.", grammar: "artículos a/an, plurales regulares, this/that/these/those", vocab: "objetos cotidianos, colores, la sala de clases" },
  { id: "a1-4", level: "A1", title: "Mi día a día", canDo: "Puede hablar de su rutina diaria.", grammar: "presente simple (I/you/we/they), adverbios de frecuencia", vocab: "actividades diarias, la hora, los días de la semana" },
  { id: "a1-5", level: "A1", title: "Él y ella", canDo: "Puede describir las rutinas de otras personas.", grammar: "presente simple 3ª persona (he/she/it + s), do/does en preguntas", vocab: "profesiones, hábitos, verbos de acción frecuentes" },
  { id: "a1-6", level: "A1", title: "Me gusta", canDo: "Puede expresar gustos y preferencias.", grammar: "like/love/hate + sustantivo o gerundio (-ing)", vocab: "comida, deportes, pasatiempos" },
  { id: "a1-7", level: "A1", title: "¿Dónde está?", canDo: "Puede describir lugares y ubicaciones.", grammar: "there is/there are, preposiciones de lugar (in/on/under/next to)", vocab: "la casa, las habitaciones, los muebles" },
  { id: "a1-8", level: "A1", title: "Puedo hacerlo", canDo: "Puede hablar de habilidades.", grammar: "can/can't para habilidad y permiso", vocab: "deportes, instrumentos, habilidades, verbos de acción" },

  // ───────────────────────────── A2 ─────────────────────────────
  { id: "a2-1", level: "A2", title: "Ayer", canDo: "Puede narrar hechos pasados.", grammar: "pasado simple: was/were, verbos regulares (-ed) e irregulares comunes", vocab: "expresiones de tiempo pasado, eventos, viajes cortos" },
  { id: "a2-2", level: "A2", title: "Planes", canDo: "Puede hablar de planes futuros.", grammar: "'be going to' para planes e intenciones", vocab: "el clima, vacaciones, planes de fin de semana" },
  { id: "a2-3", level: "A2", title: "Comparaciones", canDo: "Puede comparar personas y cosas.", grammar: "comparativos y superlativos (-er/-est, more/most)", vocab: "adjetivos de descripción, ciudades, animales" },
  { id: "a2-4", level: "A2", title: "¿Cuánto?", canDo: "Puede hablar de cantidades y hacer compras.", grammar: "contables/incontables, some/any, much/many, a lot of", vocab: "comida, supermercado, dinero, recetas" },
  { id: "a2-5", level: "A2", title: "Justo ahora", canDo: "Puede describir acciones en progreso.", grammar: "presente continuo y contraste con presente simple", vocab: "ropa, acciones del momento, descripciones de fotos" },
  { id: "a2-6", level: "A2", title: "¿Alguna vez?", canDo: "Puede hablar de experiencias.", grammar: "presente perfecto con ever/never/just/already", vocab: "experiencias de vida, viajes, logros" },
  { id: "a2-7", level: "A2", title: "Consejos y reglas", canDo: "Puede dar consejos y hablar de obligaciones.", grammar: "should/shouldn't, must, have to", vocab: "salud, escuela, normas, hábitos saludables" },
  { id: "a2-8", level: "A2", title: "Contar historias", canDo: "Puede conectar ideas en un relato.", grammar: "conectores and/but/because/so/then, pasado continuo", vocab: "narración de anécdotas, secuencia de eventos" },

  // ───────────────────────────── B1 ─────────────────────────────
  { id: "b1-1", level: "B1", title: "Si pasa, entonces…", canDo: "Puede hablar de consecuencias reales.", grammar: "primer condicional (if + presente, will), when/unless", vocab: "decisiones, tecnología, medio ambiente" },
  { id: "b1-2", level: "B1", title: "Voz pasiva", canDo: "Puede describir procesos y hechos de forma impersonal.", grammar: "voz pasiva en presente y pasado simple", vocab: "procesos, inventos, noticias" },
  { id: "b1-3", level: "B1", title: "Dijo que…", canDo: "Puede reportar lo que otros dijeron.", grammar: "estilo indirecto (reported speech) en afirmaciones", vocab: "conversaciones, entrevistas, rumores" },
  { id: "b1-4", level: "B1", title: "Desde hace tiempo", canDo: "Puede distinguir experiencia pasada y reciente.", grammar: "presente perfecto vs pasado simple, for/since", vocab: "biografías, hitos de vida, logros" },
  { id: "b1-5", level: "B1", title: "Predicciones", canDo: "Puede hacer predicciones y expresar probabilidad.", grammar: "will vs going to, may/might para posibilidad", vocab: "futuro, opiniones, ciencia, predicciones" },
  { id: "b1-6", level: "B1", title: "Cláusulas relativas", canDo: "Puede dar definiciones y descripciones precisas.", grammar: "relativas con who/which/that/where", vocab: "definiciones, personas, lugares, objetos" },
  { id: "b1-7", level: "B1", title: "Gerundios e infinitivos", canDo: "Puede expresar preferencias y planes con precisión.", grammar: "verbo + gerundio (-ing) vs verbo + infinitivo (to)", vocab: "preferencias, metas, trabajo, estudios" },
  { id: "b1-8", level: "B1", title: "Antes lo hacía", canDo: "Puede contrastar hábitos del pasado con el presente.", grammar: "used to / would para hábitos y estados del pasado", vocab: "infancia, recuerdos, cambios de vida, antes y ahora" },
  { id: "b1-9", level: "B1", title: "¿Verdad que sí?", canDo: "Puede confirmar información y sonar más natural al conversar.", grammar: "question tags y respuestas cortas (so/neither do I)", vocab: "conversación cotidiana, acuerdo y desacuerdo, vida social" },

  // ───────────────────────────── B2 ─────────────────────────────
  { id: "b2-1", level: "B2", title: "Hipótesis", canDo: "Puede hablar de situaciones imaginarias y arrepentimientos.", grammar: "segundo y tercer condicional", vocab: "dilemas, decisiones, arrepentimientos, hipótesis" },
  { id: "b2-2", level: "B2", title: "Perfectos continuos", canDo: "Puede enfatizar duración y causa de acciones.", grammar: "presente y pasado perfecto continuo", vocab: "logros prolongados, causas y efectos, esfuerzo" },
  { id: "b2-3", level: "B2", title: "Pasiva avanzada", canDo: "Puede escribir en registro formal e impersonal.", grammar: "pasiva en todos los tiempos y con modales", vocab: "informes, ciencia, procesos formales" },
  { id: "b2-4", level: "B2", title: "Deducciones", canDo: "Puede especular sobre el presente y el pasado.", grammar: "modales de deducción: must/might/can't + have + participio", vocab: "misterios, suposiciones, evidencias" },
  { id: "b2-5", level: "B2", title: "Argumentar", canDo: "Puede contrastar ideas en un argumento.", grammar: "conectores although/however/despite/whereas/nevertheless", vocab: "debate, ensayos, opiniones razonadas" },
  { id: "b2-6", level: "B2", title: "Énfasis y deseos", canDo: "Puede expresar deseos, quejas y preferencias con matiz.", grammar: "wish/if only, would rather, it's (high) time + pasado", vocab: "emociones, preferencias, quejas educadas" },
  { id: "b2-7", level: "B2", title: "Phrasal verbs clave", canDo: "Puede usar verbos compuestos frecuentes con naturalidad.", grammar: "phrasal verbs separables e inseparables de uso frecuente", vocab: "rutina, trabajo, relaciones, tecnología" },
  { id: "b2-8", level: "B2", title: "Formal o informal", canDo: "Puede ajustar el tono según la situación y la persona.", grammar: "registro formal vs informal, cortesía y peticiones indirectas", vocab: "correos, solicitudes, situaciones sociales y laborales" },
  { id: "b2-9", level: "B2", title: "Relatos con detalle", canDo: "Puede narrar historias complejas ubicando bien los hechos en el tiempo.", grammar: "tiempos narrativos combinados (past perfect / past perfect continuous + past simple) y conectores narrativos", vocab: "anécdotas, biografías, noticias, secuencia detallada" },

  // ───────────────────────────── C1 ─────────────────────────────
  { id: "c1-1", level: "C1", title: "Inversión", canDo: "Puede usar un estilo enfático y formal.", grammar: "inversión (hardly/never/not only/no sooner…)", vocab: "discurso formal, énfasis dramático, literatura" },
  { id: "c1-2", level: "C1", title: "Cláusulas avanzadas", canDo: "Puede escribir con estructuras sofisticadas y concisas.", grammar: "cláusulas de participio y oraciones hendidas (cleft: It was… / What I…)", vocab: "escritura académica, síntesis, precisión" },
  { id: "c1-3", level: "C1", title: "Matices modales", canDo: "Puede matizar afirmaciones y suavizar el discurso (hedging).", grammar: "modalidad matizada y hedging (tends to, is likely to, may well)", vocab: "registro académico, cautela, probabilidad" },
  { id: "c1-4", level: "C1", title: "Colocaciones e idioms", canDo: "Puede expresarse con naturalidad casi nativa.", grammar: "colocaciones frecuentes, phrasal verbs avanzados, idioms", vocab: "lenguaje idiomático, fluidez, expresiones naturales" },
  { id: "c1-5", level: "C1", title: "Cohesión y registro", canDo: "Puede adaptar el registro y cohesionar textos largos.", grammar: "marcadores del discurso, registro formal vs informal", vocab: "cohesión textual, tono, adecuación al contexto" },
  { id: "c1-6", level: "C1", title: "Cohesión avanzada", canDo: "Puede enlazar ideas complejas en textos largos con fluidez.", grammar: "marcadores del discurso avanzados (moreover, consequently, notwithstanding, thereby)", vocab: "ensayo, argumentación formal, transiciones" },
  { id: "c1-7", level: "C1", title: "Verbos de reporte con matiz", canDo: "Puede reportar ideas ajenas transmitiendo actitud y matiz.", grammar: "reporting verbs y su connotación (claim, concede, assert, imply, allege)", vocab: "prensa, debate, citas, opiniones matizadas" },
  { id: "c1-8", level: "C1", title: "Estilo académico", canDo: "Puede escribir en un registro formal, preciso e impersonal.", grammar: "nominalización y estructuras impersonales del estilo académico", vocab: "informes, ciencia, abstracción, síntesis" },
  { id: "c1-9", level: "C1", title: "Colocaciones formales", canDo: "Puede elegir combinaciones de palabras naturales y precisas.", grammar: "colocaciones formales y phrasal verbs avanzados", vocab: "negocios, academia, expresión precisa" },

  // ───────────────────────────── C2 ─────────────────────────────
  { id: "c2-1", level: "C2", title: "Modismos y lenguaje figurado", canDo: "Puede comprender y usar expresiones idiomáticas como un nativo.", grammar: "idioms, lenguaje figurado y expresiones culturales", vocab: "cultura, humor, conversación natural, dichos" },
  { id: "c2-2", level: "C2", title: "Matices y connotación", canDo: "Puede elegir la palabra exacta según su connotación y tono.", grammar: "elección léxica fina: sinónimos, connotación y registro", vocab: "persuasión, tono, precisión léxica, estilo" },
  { id: "c2-3", level: "C2", title: "Ironía y subtexto", canDo: "Puede captar y producir ironía, humor y dobles sentidos.", grammar: "ironía, sarcasmo, understatement y subtexto", vocab: "humor, crítica, medios, sutileza" },
  { id: "c2-4", level: "C2", title: "Retórica y debate", canDo: "Puede argumentar, conceder y refutar con sofisticación.", grammar: "recursos retóricos: concesión, refutación, énfasis persuasivo", vocab: "debate formal, retórica, discurso público" },
  { id: "c2-5", level: "C2", title: "Estilo y elegancia", canDo: "Puede escribir con ritmo, variación y elegancia.", grammar: "variación sintáctica, cohesión avanzada y ritmo de la prosa", vocab: "ensayo literario, estilo, escritura creativa" },
  { id: "c2-6", level: "C2", title: "Inglés experto", canDo: "Puede desenvolverse en contextos profesionales y académicos exigentes.", grammar: "registro experto: presentaciones, papers y negociación de alto nivel", vocab: "profesional, académico, especializado, técnico" },
];

/** Unidades de un nivel (cada nivel A1→C2 tiene su propio plan). */
export function unitsForLevel(level: CEFRLevel): CurriculumUnit[] {
  return CURRICULUM.filter((u) => u.level === level);
}

/** Orden de niveles del currículo (A1 → C2). */
export const LEVEL_SEQUENCE: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * Nivel MÁXIMO permitido por el avance en el currículo. Para estar en un nivel,
 * el alumno debe haber completado (al menos una vez) todas las unidades de los
 * niveles anteriores. `grammarLessonsDone` = nº de lecciones de gramática hechas.
 *
 * Es la base de la "doble exigencia" para ascender: además del XP, hay que haber
 * recorrido todas las unidades del nivel.
 */
export function curriculumCapLevel(grammarLessonsDone: number): CEFRLevel {
  let cap: CEFRLevel = "A1";
  let need = 0;
  for (const lvl of LEVEL_SEQUENCE) {
    if (grammarLessonsDone >= need) cap = lvl;
    need += unitsForLevel(lvl).length;
  }
  return cap;
}

/** Unidades que faltan por completar dentro del nivel indicado (para mensajes). */
export function unitsRemainingInLevel(level: CEFRLevel, grammarLessonsDone: number): number {
  let unitsBelow = 0;
  for (const lvl of LEVEL_SEQUENCE) {
    if (lvl === level) break;
    unitsBelow += unitsForLevel(lvl).length;
  }
  const doneInLevel = Math.max(0, grammarLessonsDone - unitsBelow);
  return Math.max(0, unitsForLevel(level).length - doneInLevel);
}

/**
 * Elige la unidad a enseñar. `index` (p. ej. nº de lecciones completadas) hace
 * que el alumno avance EN ORDEN por las unidades del nivel, ciclando al terminar.
 */
export function pickCurriculumUnit(level: CEFRLevel, index: number): CurriculumUnit {
  const units = unitsForLevel(level);
  const i = ((index % units.length) + units.length) % units.length;
  return units[i];
}
