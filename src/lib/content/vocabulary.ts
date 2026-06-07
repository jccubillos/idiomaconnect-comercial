/**
 * BANCO DE VOCABULARIO CEFR (A1 → C2) — curado para el modo Battle 2.0 y futuros modos.
 *
 * Cada palabra: inglés, traducción al español y una pista de pronunciación legible
 * para hispanohablantes (la pronunciación real la da el audio TTS). Las palabras están
 * planificadas por nivel para un aprendizaje ordenado y NO se repiten dentro del banco.
 */
import type { CEFRLevel } from "@/lib/supabase/database.types";

export interface VocabWord {
  en: string;
  es: string;
  pron: string; // aproximación fonética para mostrar
}

export const VOCABULARY: Record<CEFRLevel, VocabWord[]> = {
  A1: [
    { en: "dog", es: "perro", pron: "dog" },
    { en: "cat", es: "gato", pron: "cat" },
    { en: "house", es: "casa", pron: "jaus" },
    { en: "water", es: "agua", pron: "uóter" },
    { en: "milk", es: "leche", pron: "milk" },
    { en: "apple", es: "manzana", pron: "ápol" },
    { en: "bread", es: "pan", pron: "bred" },
    { en: "book", es: "libro", pron: "buk" },
    { en: "table", es: "mesa", pron: "téibol" },
    { en: "chair", es: "silla", pron: "cher" },
    { en: "school", es: "escuela", pron: "skuul" },
    { en: "friend", es: "amigo", pron: "frend" },
    { en: "red", es: "rojo", pron: "red" },
    { en: "blue", es: "azul", pron: "blu" },
    { en: "big", es: "grande", pron: "big" },
    { en: "small", es: "pequeño", pron: "smol" },
    { en: "happy", es: "feliz", pron: "jápi" },
    { en: "sun", es: "sol", pron: "san" },
    { en: "hand", es: "mano", pron: "jand" },
    { en: "day", es: "día", pron: "déi" },
  ],
  A2: [
    { en: "kitchen", es: "cocina", pron: "kítchen" },
    { en: "breakfast", es: "desayuno", pron: "brékfast" },
    { en: "weather", es: "clima", pron: "uéder" },
    { en: "holiday", es: "vacaciones", pron: "jólidei" },
    { en: "ticket", es: "boleto", pron: "tíket" },
    { en: "money", es: "dinero", pron: "máni" },
    { en: "market", es: "mercado", pron: "márket" },
    { en: "doctor", es: "médico", pron: "dóctor" },
    { en: "letter", es: "carta", pron: "léter" },
    { en: "music", es: "música", pron: "miúsik" },
    { en: "garden", es: "jardín", pron: "gárden" },
    { en: "river", es: "río", pron: "ríver" },
    { en: "bridge", es: "puente", pron: "brich" },
    { en: "mountain", es: "montaña", pron: "máunten" },
    { en: "key", es: "llave", pron: "kii" },
    { en: "clock", es: "reloj", pron: "clok" },
    { en: "neighbor", es: "vecino", pron: "néibor" },
    { en: "language", es: "idioma", pron: "lángüich" },
    { en: "story", es: "cuento", pron: "stóri" },
    { en: "pocket", es: "bolsillo", pron: "póket" },
  ],
  B1: [
    { en: "journey", es: "viaje", pron: "yérni" },
    { en: "decision", es: "decisión", pron: "disíchon" },
    { en: "advice", es: "consejo", pron: "adváis" },
    { en: "opinion", es: "opinión", pron: "opínion" },
    { en: "experience", es: "experiencia", pron: "ikspírians" },
    { en: "behavior", es: "comportamiento", pron: "bijéivior" },
    { en: "environment", es: "medioambiente", pron: "enváironment" },
    { en: "knowledge", es: "conocimiento", pron: "nólich" },
    { en: "success", es: "éxito", pron: "saksés" },
    { en: "failure", es: "fracaso", pron: "féilyur" },
    { en: "challenge", es: "desafío", pron: "chálench" },
    { en: "opportunity", es: "oportunidad", pron: "oportiúniti" },
    { en: "skill", es: "habilidad", pron: "skil" },
    { en: "goal", es: "meta", pron: "goul" },
    { en: "habit", es: "hábito", pron: "jábit" },
    { en: "mood", es: "ánimo", pron: "muud" },
    { en: "crowd", es: "multitud", pron: "kraud" },
    { en: "budget", es: "presupuesto", pron: "báyet" },
    { en: "deadline", es: "fecha límite", pron: "dédlain" },
    { en: "audience", es: "público", pron: "ódiens" },
  ],
  B2: [
    { en: "achievement", es: "logro", pron: "achívment" },
    { en: "assumption", es: "suposición", pron: "asámpchon" },
    { en: "consequence", es: "consecuencia", pron: "cónsicuens" },
    { en: "efficiency", es: "eficiencia", pron: "efíchensi" },
    { en: "framework", es: "marco", pron: "fréimuork" },
    { en: "hypothesis", es: "hipótesis", pron: "jaipózesis" },
    { en: "incentive", es: "incentivo", pron: "inséntiv" },
    { en: "leverage", es: "influencia", pron: "léverach" },
    { en: "negotiation", es: "negociación", pron: "nigochiéichon" },
    { en: "perception", es: "percepción", pron: "persépchon" },
    { en: "reliability", es: "fiabilidad", pron: "rilaiabíliti" },
    { en: "scope", es: "alcance", pron: "skoup" },
    { en: "threshold", es: "umbral", pron: "zréshold" },
    { en: "transparency", es: "transparencia", pron: "transpárensi" },
    { en: "trend", es: "tendencia", pron: "trend" },
    { en: "willingness", es: "disposición", pron: "uílingnes" },
    { en: "drawback", es: "inconveniente", pron: "dróbak" },
    { en: "breakthrough", es: "avance", pron: "bréikzru" },
    { en: "controversy", es: "controversia", pron: "cóntroversi" },
    { en: "insight", es: "perspicacia", pron: "ínsait" },
  ],
  C1: [
    { en: "ambiguity", es: "ambigüedad", pron: "ambigiúiti" },
    { en: "coherence", es: "coherencia", pron: "cojírens" },
    { en: "compliance", es: "cumplimiento", pron: "compláians" },
    { en: "discrepancy", es: "discrepancia", pron: "discrépansi" },
    { en: "endeavor", es: "empeño", pron: "endévor" },
    { en: "feasibility", es: "factibilidad", pron: "fizibíliti" },
    { en: "implication", es: "implicación", pron: "implikéichon" },
    { en: "nuance", es: "matiz", pron: "niúans" },
    { en: "paradigm", es: "paradigma", pron: "páradaim" },
    { en: "premise", es: "premisa", pron: "prémis" },
    { en: "prevalence", es: "prevalencia", pron: "prévalens" },
    { en: "rationale", es: "fundamento", pron: "rashonál" },
    { en: "resilience", es: "resiliencia", pron: "rizílians" },
    { en: "scrutiny", es: "escrutinio", pron: "scrútini" },
    { en: "stance", es: "postura", pron: "stans" },
    { en: "viability", es: "viabilidad", pron: "vaiabíliti" },
    { en: "versatility", es: "versatilidad", pron: "versatíliti" },
    { en: "undertaking", es: "tarea/empresa", pron: "andertéiking" },
    { en: "discretion", es: "discreción", pron: "discréchon" },
    { en: "consensus", es: "consenso", pron: "consénsus" },
  ],
  C2: [
    { en: "astuteness", es: "astucia", pron: "astiútnes" },
    { en: "connotation", es: "connotación", pron: "conotéichon" },
    { en: "deference", es: "deferencia", pron: "déferens" },
    { en: "eloquence", es: "elocuencia", pron: "élocuens" },
    { en: "idiosyncrasy", es: "idiosincrasia", pron: "idiosíncrasi" },
    { en: "juxtaposition", es: "yuxtaposición", pron: "yakstaposíchon" },
    { en: "meticulousness", es: "meticulosidad", pron: "metíkiulosnes" },
    { en: "ostentation", es: "ostentación", pron: "ostentéichon" },
    { en: "pragmatism", es: "pragmatismo", pron: "prágmatism" },
    { en: "propensity", es: "propensión", pron: "propénsiti" },
    { en: "quintessence", es: "quintaesencia", pron: "kuintésens" },
    { en: "redundancy", es: "redundancia", pron: "ridándansi" },
    { en: "sagacity", es: "sagacidad", pron: "sagásiti" },
    { en: "subtlety", es: "sutileza", pron: "sátlti" },
    { en: "tenacity", es: "tenacidad", pron: "tenásiti" },
    { en: "ubiquity", es: "ubicuidad", pron: "iubíkuiti" },
    { en: "vindication", es: "reivindicación", pron: "vindikéichon" },
    { en: "zeal", es: "fervor", pron: "ziil" },
    { en: "candor", es: "franqueza", pron: "cándor" },
    { en: "prudence", es: "prudencia", pron: "prúdens" },
  ],
};

export interface BattleWord extends VocabWord {
  /** 4 opciones en español (una correcta), ya barajadas. */
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Devuelve las palabras del nivel (con fallback a A1 si está vacío). */
export function wordsForLevel(level: CEFRLevel): VocabWord[] {
  return VOCABULARY[level]?.length ? VOCABULARY[level] : VOCABULARY.A1;
}

/**
 * Construye una sesión de Battle: `count` palabras del nivel, cada una con 4 opciones
 * en español (1 correcta + 3 distractores del mismo nivel), barajadas para que la
 * respuesta correcta caiga en distinta posición cada vez.
 */
export function buildBattleSession(level: CEFRLevel, count = 12): BattleWord[] {
  const pool = wordsForLevel(level);
  const chosen = shuffle(pool).slice(0, Math.min(count, pool.length));
  return chosen.map((w) => {
    const distractors = shuffle(pool.filter((x) => x.es !== w.es))
      .slice(0, 3)
      .map((x) => x.es);
    return { ...w, options: shuffle([w.es, ...distractors]) };
  });
}
