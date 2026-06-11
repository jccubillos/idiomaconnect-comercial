/**
 * "LUMI EN TU COLEGIO" — mundo EXCLUSIVO para alumnos de colegio.
 *
 * Solo lo ven los kid_profiles con course_id (alumnos de un curso). El profesor
 * lo personaliza desde su panel: tema/contenidos, mensaje a los alumnos,
 * herramientas activas (de un catálogo de 16) y evaluaciones de entrenamiento.
 *
 * Las sesiones hechas desde este mundo se guardan con world_key =
 * SCHOOL_WORLD_KEY, lo que permite separar en el panel del profesor lo que el
 * alumno hace AQUÍ de lo que hace en el resto de la app, y calcular la "racha
 * del colegio" (días seguidos con ≥100 XP en este mundo).
 */

export const SCHOOL_WORLD_KEY = "school_world";

/** XP mínimo en un día (en este mundo) para que cuente para la racha escolar. */
export const SCHOOL_STREAK_MIN_XP = 100;

export const SCHOOL_WORLD = {
  key: SCHOOL_WORLD_KEY,
  emoji: "🏫",
  name: "Lumi en tu Colegio",
  tagline: "Lo que tu curso está aprendiendo",
  intro: "Tu profesor preparó este mundo para tu curso: practica exactamente lo que están viendo en clases.",
  accent: "#c464ff",
} as const;

export interface SchoolTool {
  key: string;     // clave del modo (coincide con MODES de modes.ts)
  emoji: string;
  name: string;
  /** Para el alumno (tarjeta del mundo). */
  short: string;
  /** Para el PROFESOR: finalidad pedagógica de la herramienta. */
  teacherDesc: string;
  /** Ruta de la actividad (se le agrega ?kid=...). */
  route: string;
}

/** Catálogo de las 16 herramientas activables en el mundo del colegio. */
export const SCHOOL_TOOLS: SchoolTool[] = [
  { key: "lesson", emoji: "📖", name: "Lección del curso", short: "Lección + quiz del tema del curso", teacherDesc: "La IA genera una lección y un quiz centrados en el tema/contenidos que definiste para el curso. Es la herramienta central del mundo.", route: "/lesson" },
  { key: "flashcards", emoji: "🃏", name: "Flashcards", short: "Vocabulario con imágenes", teacherDesc: "Tarjetas de vocabulario con selección múltiple. Ideal para memorizar palabras nuevas en sesiones cortas.", route: "/flashcards" },
  { key: "battle", emoji: "⚔️", name: "Battle Mode", short: "Duelo de vocabulario", teacherDesc: "Quiz gamificado con barras de vida: motiva a practicar vocabulario por nivel CEFR compitiendo contra el 'Syntax Virus'.", route: "/battle" },
  { key: "sentence_builder", emoji: "🧩", name: "Armar Oraciones", short: "Ordena las piezas", teacherDesc: "El alumno ordena palabras desordenadas para formar oraciones correctas. Refuerza sintaxis y orden gramatical.", route: "/sentence-builder" },
  { key: "story_fill", emoji: "📜", name: "Historias para Completar", short: "Completa el relato", teacherDesc: "Relatos cortos con espacios en blanco (cloze). Trabaja comprensión lectora y gramática en contexto.", route: "/story-fill" },
  { key: "listen_id", emoji: "👂", name: "Escucha e Identifica", short: "Oye y elige el significado", teacherDesc: "El alumno escucha una palabra y elige su significado. Entrena comprensión auditiva con audio nativo.", route: "/listen-id" },
  { key: "minimal_pairs", emoji: "🎧", name: "Pares Mínimos", short: "Distingue sonidos parecidos", teacherDesc: "Discriminación de sonidos que los hispanohablantes confunden (ship/sheep). Afina el oído fonético.", route: "/minimal-pairs" },
  { key: "pronunciation", emoji: "🎤", name: "Pronunciación", short: "Grábate y recibe puntaje", teacherDesc: "El alumno se graba pronunciando y recibe un puntaje de precisión. Entrena producción oral palabra a palabra.", route: "/pronunciation" },
  { key: "shadow_speaking", emoji: "🔊", name: "Shadowing", short: "Repite después del audio", teacherDesc: "Técnica de imitación: escucha una frase nativa y la repite. Mejora fluidez, ritmo y entonación.", route: "/shadow-speaking" },
  { key: "conversation", emoji: "💬", name: "Conversación", short: "Role-play con la IA", teacherDesc: "Diálogo guiado con la IA en escenarios reales (restaurante, viaje). Práctica conversacional segura y paciente.", route: "/conversation" },
  { key: "speaking_journal", emoji: "📔", name: "Diario Hablado", short: "Habla 30-60s sobre un tema", teacherDesc: "Producción oral espontánea: el alumno habla libremente sobre un tema y recibe retroalimentación. Para niveles A2+.", route: "/speaking-journal" },
  { key: "translate_inverse", emoji: "🔁", name: "Traduce al Inglés", short: "Del español al inglés", teacherDesc: "Traducción ES→EN evaluada por la IA con correcciones línea a línea. Escritura productiva exigente (A2+).", route: "/translate-inverse" },
  { key: "describe_scene", emoji: "🖼", name: "Describe la Escena", short: "Escribe lo que ves", teacherDesc: "El alumno describe una escena por escrito y la IA corrige. Desarrolla vocabulario descriptivo y redacción (A2+).", route: "/describe-scene" },
  { key: "memory_match", emoji: "🎴", name: "Memoria", short: "Empareja las palabras", teacherDesc: "Juego de memoria emparejando palabra y significado. Repaso liviano de vocabulario, ideal para los más pequeños.", route: "/memory-match" },
  { key: "srs_review", emoji: "🧠", name: "Repaso Inteligente", short: "Las palabras que tocan hoy", teacherDesc: "Repaso espaciado científico (SM-2): las palabras difíciles vuelven más seguido. Consolida vocabulario a largo plazo.", route: "/srs" },
  { key: "exam", emoji: "🎓", name: "Examen de Nivel", short: "Mide tu nivel CEFR", teacherDesc: "Diagnóstico CEFR (A1-C2) de 2-3 minutos. Útil al inicio del año y para medir avances por semestre.", route: "/exam" },
];

/** Herramientas activas por defecto cuando el profesor aún no personaliza. */
export const DEFAULT_ENABLED_MODES: string[] = [
  "lesson",
  "flashcards",
  "battle",
  "sentence_builder",
  "story_fill",
  "listen_id",
  "pronunciation",
  "memory_match",
];

/** Herramientas activas de un curso (con fallback al set por defecto). */
export function enabledToolsFor(enabledModes: string[] | null | undefined): SchoolTool[] {
  const keys = enabledModes && enabledModes.length ? enabledModes : DEFAULT_ENABLED_MODES;
  return SCHOOL_TOOLS.filter((t) => keys.includes(t.key));
}
