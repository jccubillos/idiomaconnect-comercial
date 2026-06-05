/**
 * Banco CURADO de preguntas del examen diagnóstico CEFR.
 *
 * Reemplaza la generación por IA (que producía preguntas ambiguas o sin respuesta
 * única). Cada pregunta tiene UNA sola respuesta correcta verificada manualmente,
 * con distractores claramente incorrectos. Estilo inspirado en los tests de
 * placement reconocidos (Cambridge/Oxford/EF SET), con ítems 100% originales.
 *
 * Estructura: 6 preguntas por nivel (A1→C1). El examen sirve 3 por nivel,
 * elegidas al azar, con las opciones barajadas — así el re-test no es idéntico.
 */
import type { ExamQuestion } from "@/lib/groq/exam";

export const EXAM_BANK: ExamQuestion[] = [
  // ───────────────────────── A1 ─────────────────────────
  { level: "A1", q: "She ___ my sister.", options: ["is", "are", "am", "be"], answer: "is", explanation_es: "Con 'she' se usa 'is'." },
  { level: "A1", q: "I have three ___.", options: ["book", "books", "bookes", "a book"], answer: "books", explanation_es: "'three' exige plural: 'books'." },
  { level: "A1", q: "___ they your friends?", options: ["Are", "Is", "Am", "Do"], answer: "Are", explanation_es: "Con 'they' la pregunta usa 'Are'." },
  { level: "A1", q: "He ___ coffee every morning.", options: ["drinks", "drink", "drinking", "to drink"], answer: "drinks", explanation_es: "3ª persona del presente simple: 'drinks'." },
  { level: "A1", q: "There ___ two cats in the garden.", options: ["are", "is", "am", "be"], answer: "are", explanation_es: "Plural 'two cats' → 'there are'." },
  { level: "A1", q: "What ___ you like to eat?", options: ["do", "does", "are", "is"], answer: "do", explanation_es: "Pregunta con 'you' → auxiliar 'do'." },

  // ───────────────────────── A2 ─────────────────────────
  { level: "A2", q: "Last weekend we ___ to the beach.", options: ["went", "go", "gone", "going"], answer: "went", explanation_es: "'Last weekend' → pasado simple 'went'." },
  { level: "A2", q: "My brother is ___ than me.", options: ["taller", "tall", "tallest", "more tall"], answer: "taller", explanation_es: "Comparativo con 'than': 'taller'." },
  { level: "A2", q: "Listen! Someone ___ at the door.", options: ["is knocking", "knocks", "knocked", "knock"], answer: "is knocking", explanation_es: "'Listen!' indica acción ahora → presente continuo." },
  { level: "A2", q: "I would like ___ water, please.", options: ["some", "any", "many", "a"], answer: "some", explanation_es: "Ofrecimiento/pedido con incontable: 'some'." },
  { level: "A2", q: "We didn't ___ to school yesterday.", options: ["go", "went", "gone", "going"], answer: "go", explanation_es: "Tras 'didn't' va el verbo base: 'go'." },
  { level: "A2", q: "This book is ___ interesting than that one.", options: ["more", "most", "much", "very"], answer: "more", explanation_es: "Comparativo de adjetivo largo: 'more interesting … than'." },

  // ───────────────────────── B1 ─────────────────────────
  { level: "B1", q: "I have ___ been to London.", options: ["never", "ever", "yet", "since"], answer: "never", explanation_es: "Presente perfecto con experiencia negativa: 'have never been'." },
  { level: "B1", q: "If it rains tomorrow, we ___ at home.", options: ["will stay", "stay", "would stay", "stayed"], answer: "will stay", explanation_es: "Primer condicional: if + presente, 'will' + base." },
  { level: "B1", q: "This song ___ by a famous singer.", options: ["was written", "wrote", "has wrote", "writes"], answer: "was written", explanation_es: "Voz pasiva en pasado: 'was written'." },
  { level: "B1", q: "You ___ wear a uniform at this school.", options: ["have to", "are", "would", "will"], answer: "have to", explanation_es: "Obligación: 'have to wear'." },
  { level: "B1", q: "I'm good ___ playing the guitar.", options: ["at", "in", "on", "for"], answer: "at", explanation_es: "Colocación fija: 'good at'." },
  { level: "B1", q: "He said he ___ help me.", options: ["would", "will", "is", "has"], answer: "would", explanation_es: "Estilo indirecto: 'will' pasa a 'would'." },

  // ───────────────────────── B2 ─────────────────────────
  { level: "B2", q: "By next year, I ___ here for a decade.", options: ["will have worked", "will work", "have worked", "worked"], answer: "will have worked", explanation_es: "Futuro perfecto: 'will have worked'." },
  { level: "B2", q: "He ___ here since 2015.", options: ["has worked", "works", "worked", "is working"], answer: "has worked", explanation_es: "Presente perfecto con 'since': 'has worked'." },
  { level: "B2", q: "The house ___ at the moment.", options: ["is being painted", "is painting", "paints", "painted"], answer: "is being painted", explanation_es: "Pasiva en presente continuo: 'is being painted'." },
  { level: "B2", q: "I'd rather you ___ tell anyone.", options: ["didn't", "don't", "not", "wouldn't"], answer: "didn't", explanation_es: "'would rather' + sujeto + pasado: 'didn't tell'." },
  { level: "B2", q: "Despite ___ very hard, she didn't pass.", options: ["studying", "study", "studied", "to study"], answer: "studying", explanation_es: "Tras 'despite' va gerundio: 'studying'." },
  { level: "B2", q: "It's high time we ___ home.", options: ["went", "go", "will go", "have gone"], answer: "went", explanation_es: "'It's high time' + pasado: 'went'." },

  // ───────────────────────── C1 ─────────────────────────
  { level: "C1", q: "Never before ___ such a beautiful sunset.", options: ["had I seen", "I had seen", "did I saw", "I saw"], answer: "had I seen", explanation_es: "Inversión tras expresión negativa al inicio: 'had I seen'." },
  { level: "C1", q: "The plan fell ___ at the last minute.", options: ["through", "out", "off", "down"], answer: "through", explanation_es: "'fall through' = fracasar." },
  { level: "C1", q: "She has a natural ___ for music.", options: ["aptitude", "attitude", "altitude", "amplitude"], answer: "aptitude", explanation_es: "'aptitude' = talento/capacidad natural." },
  { level: "C1", q: "Were it not ___ his help, we would have failed.", options: ["for", "to", "of", "with"], answer: "for", explanation_es: "Estructura formal: 'were it not for'." },
  { level: "C1", q: "Little ___ that he was being watched.", options: ["did he know", "he knew", "he did know", "knew he"], answer: "did he know", explanation_es: "Inversión enfática: 'Little did he know'." },
  { level: "C1", q: "Your proposal doesn't hold ___, I'm afraid.", options: ["water", "air", "weight", "ground"], answer: "water", explanation_es: "Idiom 'hold water' = ser válido/sostenerse." },
];

/** Baraja una copia de un array (Fisher–Yates). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LEVELS: ExamQuestion["level"][] = ["A1", "A2", "B1", "B2", "C1"];

/**
 * Arma un examen de 15 preguntas: 3 por nivel (A1→C1), elegidas al azar del banco,
 * con las opciones barajadas. La respuesta correcta sigue siendo el mismo texto.
 */
export function buildPlacementExam(perLevel = 3): ExamQuestion[] {
  const out: ExamQuestion[] = [];
  for (const level of LEVELS) {
    const pool = EXAM_BANK.filter((q) => q.level === level);
    const picked = shuffle(pool).slice(0, perLevel);
    for (const q of picked) {
      out.push({ ...q, options: shuffle(q.options) });
    }
  }
  return out;
}
