/**
 * Conversation scenarios — used by Conversation Mode (role-play).
 * Each scenario gives the LLM a setting, a persona to play, and objectives.
 *
 * Adding scenarios = adding pedagogy. No code change required.
 */

export interface ConversationScenario {
  key: string;
  emoji: string;
  name: string;
  world: string;                 // matches a world key
  setting: string;               // narrative context
  aiPersona: string;             // who the AI plays
  kidRole: string;               // who the kid plays
  objectives: string[];          // checkable success criteria
  starterAI: string;             // opening line from AI (so kid never sees an empty screen)
  minCefr: "A1" | "A2" | "B1" | "B2";
}

export const SCENARIOS: ConversationScenario[] = [
  {
    key: "cafe_order",
    emoji: "☕",
    name: "Pedir café",
    world: "chat",
    setting: "Estás en un café en Londres. Quieres pedir algo para tomar y comer.",
    aiPersona: "barista friendly de un café británico llamado 'The Daily Grind'",
    kidRole: "cliente",
    objectives: [
      "Greet the barista",
      "Order a drink",
      "Ask about a food item",
      "Say thank you and goodbye",
    ],
    starterAI: "Hi there! Welcome to The Daily Grind. What can I get for you today?",
    minCefr: "A1",
  },
  {
    key: "airport_checkin",
    emoji: "✈️",
    name: "Check-in en aeropuerto",
    world: "chat",
    setting: "Estás haciendo check-in en el aeropuerto para un vuelo internacional.",
    aiPersona: "ground-staff agent de una aerolínea internacional",
    kidRole: "pasajero",
    objectives: [
      "Show your passport",
      "Confirm flight number and destination",
      "Ask about luggage allowance",
      "Ask for a window seat",
    ],
    starterAI: "Good morning! May I see your passport and ticket, please?",
    minCefr: "A2",
  },
  {
    key: "school_intro",
    emoji: "🏫",
    name: "Primer día en una escuela nueva",
    world: "chat",
    setting: "Es tu primer día en una escuela de intercambio. Vas a presentarte ante la clase.",
    aiPersona: "compañero/a de clase amigable que te quiere ayudar",
    kidRole: "estudiante de intercambio",
    objectives: [
      "Introduce yourself (name, age, country)",
      "Talk about a hobby",
      "Ask the classmate a question",
      "Make plans to do something together",
    ],
    starterAI: "Hey! You're the new student, right? Welcome! I'm Alex. What's your name?",
    minCefr: "A1",
  },
  {
    key: "doctor_visit",
    emoji: "🩺",
    name: "Visita al médico",
    world: "chat",
    setting: "No te sientes bien y vas al médico en un hospital de habla inglesa.",
    aiPersona: "doctor/a amable que hace preguntas paso a paso",
    kidRole: "paciente",
    objectives: [
      "Greet the doctor",
      "Describe a symptom",
      "Say how long you've felt this way",
      "Understand and respond to a recommendation",
    ],
    starterAI: "Hello, please come in and have a seat. So, what brings you in today?",
    minCefr: "A2",
  },
  {
    key: "hotel_problem",
    emoji: "🏨",
    name: "Problema en el hotel",
    world: "chat",
    setting: "Llegaste a tu hotel y hay un problema con tu habitación (sin agua caliente, llave que no abre, etc.).",
    aiPersona: "recepcionista de hotel profesional",
    kidRole: "huésped",
    objectives: [
      "Greet the receptionist",
      "Explain the problem clearly",
      "Ask for a solution",
      "Thank them politely",
    ],
    starterAI: "Good evening! Is everything alright? How can I help you?",
    minCefr: "A2",
  },
];

export function getScenario(key: string): ConversationScenario | undefined {
  return SCENARIOS.find((s) => s.key === key);
}
