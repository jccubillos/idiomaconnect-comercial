/**
 * Lesson modes — the 15 practice modalities from the Streamlit MVP.
 * Each mode maps to: (a) prompt strategy, (b) UI screen, (c) skill tagged
 * on lesson_sessions row.
 */

import type { Skill } from "@/lib/supabase/database.types";

export type LessonMode =
  | "lesson"            // classic quiz (MC + fill-in-the-blank)
  | "pronunciation"     // record + score
  | "conversation"      // role-play with AI
  | "flashcards"        // simple word↔meaning flip
  | "sentence_builder"  // arrange word tiles
  | "story_fill"        // cloze in a short narrative
  | "speaking_journal"  // 30s spontaneous speech
  | "exam"              // diagnostic CEFR exam
  | "shadow_speaking"   // repeat-after-me
  | "translate_inverse" // ES → EN translation
  | "describe_scene"    // describe an image/prompt
  | "minimal_pairs"     // distinguish similar sounds
  | "listen_id"         // hear word, pick meaning
  | "memory_match"      // pair matching
  | "srs_review"        // due flashcards (SM-2)
  | "battle"            // gamified quiz with HP bars
  | "personal_talk";    // habla de tu vida real (speaking personalizado)

export interface ModeMeta {
  key: LessonMode;
  emoji: string;
  name: string;
  short: string;
  skill: Skill;
  unlocked: boolean;        // false = come después de F1
  minCefr?: "A1" | "A2" | "B1" | "B2";
}

export const MODES: Record<LessonMode, ModeMeta> = {
  lesson: { key: "lesson", emoji: "📖", name: "Lección Clásica", short: "Quiz MC + completar", skill: "grammar", unlocked: true },
  battle: { key: "battle", emoji: "⚔️", name: "Battle Mode", short: "Vocab combate vs Syntax Virus", skill: "vocabulary", unlocked: true },
  flashcards: { key: "flashcards", emoji: "🃏", name: "Flashcards", short: "Palabras y traducciones", skill: "vocabulary", unlocked: true },
  pronunciation: { key: "pronunciation", emoji: "🎤", name: "Pronunciación", short: "Grábate y recibe score", skill: "speaking", unlocked: true },
  srs_review: { key: "srs_review", emoji: "🧠", name: "Repaso (SRS)", short: "Tarjetas que tocan hoy", skill: "vocabulary", unlocked: true },
  conversation: { key: "conversation", emoji: "💬", name: "Conversación", short: "Role-play con la IA", skill: "speaking", unlocked: true, minCefr: "A1" },
  sentence_builder: { key: "sentence_builder", emoji: "🧩", name: "Armar Oraciones", short: "Ordena las piezas", skill: "grammar", unlocked: true },
  story_fill: { key: "story_fill", emoji: "📜", name: "Historia con Huecos", short: "Cloze en relato corto", skill: "reading", unlocked: true },
  speaking_journal: { key: "speaking_journal", emoji: "📔", name: "Diario Hablado", short: "30-60s sobre el prompt", skill: "speaking", unlocked: true, minCefr: "A2" },
  exam: { key: "exam", emoji: "🎓", name: "Examen Diagnóstico", short: "Mide tu CEFR", skill: "grammar", unlocked: true },
  shadow_speaking: { key: "shadow_speaking", emoji: "🔊", name: "Shadowing", short: "Repite después de mí", skill: "speaking", unlocked: true },
  translate_inverse: { key: "translate_inverse", emoji: "🔁", name: "Traduce al Inglés", short: "ES → EN", skill: "writing", unlocked: true, minCefr: "A2" },
  describe_scene: { key: "describe_scene", emoji: "🖼", name: "Describe la Escena", short: "Escribe lo que ves", skill: "writing", unlocked: true, minCefr: "A2" },
  minimal_pairs: { key: "minimal_pairs", emoji: "🎧", name: "Pares Mínimos", short: "Distingue sonidos parecidos", skill: "listening", unlocked: true },
  listen_id: { key: "listen_id", emoji: "👂", name: "Escucha & Identifica", short: "Oye, elige significado", skill: "listening", unlocked: true },
  memory_match: { key: "memory_match", emoji: "🎴", name: "Memoria", short: "Empareja palabras", skill: "vocabulary", unlocked: true },
  personal_talk: { key: "personal_talk", emoji: "🗣️", name: "Háblame de ti", short: "Habla de tu vida real", skill: "speaking", unlocked: true, minCefr: "A1" },
};

export const UNLOCKED_MODES = Object.values(MODES).filter((m) => m.unlocked);
