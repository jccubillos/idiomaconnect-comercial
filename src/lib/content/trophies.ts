/**
 * Trophy catalog. Predicates evaluate against an aggregated stats object
 * built by `lib/pedagogy/stats.ts` from lesson_sessions + trophies_earned.
 */

export interface KidStats {
  totalSessions: number;
  totalXp: number;
  perfectCount: number;
  activeDays: number;
  maxConsecDays: number;
  battleWins: number;
  uniqueWorldsVisited: number;
  pronunciationCount: number;
  conversationCount: number;
  srsReviewCount: number;
}

export interface TrophyDef {
  key: string;
  icon: string;
  name: string;
  desc: string;
  color: string;
  predicate: (s: KidStats) => boolean;
}

export const TROPHY_CATALOG: TrophyDef[] = [
  // Progresión
  { key: "first_step", icon: "🚀", name: "Primer Vuelo", desc: "Completa tu primera misión",
    color: "#00eefc", predicate: (s) => s.totalSessions >= 1 },
  { key: "five_lessons", icon: "🔥", name: "Combo x5", desc: "Completa 5 misiones",
    color: "#ff5351", predicate: (s) => s.totalSessions >= 5 },
  { key: "ten_lessons", icon: "⚡", name: "Combo x10", desc: "Completa 10 misiones",
    color: "#ffd400", predicate: (s) => s.totalSessions >= 10 },
  // Calidad
  { key: "perfect", icon: "🎯", name: "Notón Perfecto", desc: "Saca 100% en un quiz",
    color: "#39ff14", predicate: (s) => s.perfectCount >= 1 },
  // XP milestones
  { key: "xp_500", icon: "💎", name: "Club 500 XP", desc: "Acumula 500 XP",
    color: "#c464ff", predicate: (s) => s.totalXp >= 500 },
  { key: "xp_1000", icon: "🏆", name: "Club 1000 XP", desc: "Acumula 1000 XP",
    color: "#ffd400", predicate: (s) => s.totalXp >= 1000 },
  { key: "xp_2000", icon: "🌟", name: "Leyenda", desc: "Acumula 2000 XP",
    color: "#ff66c4", predicate: (s) => s.totalXp >= 2000 },
  // Constancia
  { key: "active_5d", icon: "📅", name: "Disciplina", desc: "Activo en 5 días distintos",
    color: "#00eefc", predicate: (s) => s.activeDays >= 5 },
  { key: "streak_3d", icon: "⛅", name: "Racha 3 días", desc: "3 días consecutivos activos",
    color: "#39ff14", predicate: (s) => s.maxConsecDays >= 3 },
  { key: "streak_7d", icon: "🌅", name: "Racha 7 días", desc: "7 días consecutivos activos",
    color: "#ff5351", predicate: (s) => s.maxConsecDays >= 7 },
  // Battle
  { key: "battle_first", icon: "🥷", name: "Bautismo de Fuego", desc: "Gana tu primera batalla",
    color: "#ff5351", predicate: (s) => s.battleWins >= 1 },
  { key: "battle_5", icon: "🌪️", name: "Guerrero", desc: "Gana 5 batallas",
    color: "#ffd400", predicate: (s) => s.battleWins >= 5 },
  // Exploración
  { key: "explorer", icon: "🌍", name: "Explorador", desc: "Visita 4 mundos universales",
    color: "#c464ff", predicate: (s) => s.uniqueWorldsVisited >= 4 },
  // Modos
  { key: "speaker", icon: "🎤", name: "Voz Clara", desc: "Practica pronunciación 1 vez",
    color: "#39ff14", predicate: (s) => s.pronunciationCount >= 1 },
  { key: "conversator", icon: "💬", name: "Conversador", desc: "Completa 3 conversaciones",
    color: "#c464ff", predicate: (s) => s.conversationCount >= 3 },
  { key: "memory", icon: "🧠", name: "Memoria de Elefante", desc: "Repasa 50 palabras",
    color: "#ffd400", predicate: (s) => s.srsReviewCount >= 50 },
];

export interface TrophyView extends Omit<TrophyDef, "predicate"> {
  earned: boolean;
}

export function evaluateTrophies(stats: KidStats): TrophyView[] {
  return TROPHY_CATALOG.map(({ predicate, ...rest }) => ({
    ...rest,
    earned: (() => {
      try { return predicate(stats); } catch { return false; }
    })(),
  }));
}
