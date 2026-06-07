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

  // ───────────── B1 (intermedio: opiniones, planes, resolver problemas) ─────────────
  {
    key: "job_interview_teen",
    emoji: "💼",
    name: "Entrevista de trabajo de verano",
    world: "chat",
    setting: "Postulas a un trabajo de verano (ayudante en una cafetería) y tienes una entrevista.",
    aiPersona: "gerente amable pero profesional que entrevista para un puesto de verano",
    kidRole: "postulante",
    objectives: [
      "Introduce yourself and say why you want the job",
      "Describe one strength with an example",
      "Talk about your availability",
      "Ask a question about the job",
    ],
    starterAI: "Thanks for coming in! So, tell me a little about yourself and why you applied for this job.",
    minCefr: "B1",
  },
  {
    key: "return_item",
    emoji: "🛍️",
    name: "Devolver un producto con falla",
    world: "chat",
    setting: "Compraste unos audífonos que dejaron de funcionar y vuelves a la tienda a reclamar.",
    aiPersona: "empleado/a de atención al cliente de una tienda de electrónica",
    kidRole: "cliente",
    objectives: [
      "Explain what is wrong with the product",
      "Say when and where you bought it",
      "Ask for a refund or a replacement",
      "Stay polite if there is a problem",
    ],
    starterAI: "Hi, welcome to TechZone! How can I help you today?",
    minCefr: "B1",
  },
  {
    key: "plan_weekend",
    emoji: "🗺️",
    name: "Planear un fin de semana",
    world: "chat",
    setting: "Tú y un amigo quieren hacer algo el fin de semana, pero tienen ideas distintas.",
    aiPersona: "amigo/a que prefiere planes diferentes a los tuyos y propone alternativas",
    kidRole: "amigo/a",
    objectives: [
      "Suggest an activity and give a reason",
      "Respond to your friend's different idea",
      "Negotiate a plan you both like",
      "Agree on a time and place",
    ],
    starterAI: "Hey! So, what do you want to do this weekend? I was thinking maybe we could go hiking.",
    minCefr: "B1",
  },

  // ───────────── B2 (avanzado: debate, matices, persuasión) ─────────────
  {
    key: "debate_screens",
    emoji: "📱",
    name: "Debate: tiempo en pantallas",
    world: "chat",
    setting: "Debaten si los jóvenes pasan demasiado tiempo en pantallas. Defiende tu postura.",
    aiPersona: "compañero/a de debate que sostiene la postura OPUESTA a la tuya, con respeto",
    kidRole: "debatiente",
    objectives: [
      "State your opinion clearly",
      "Give at least two arguments to support it",
      "Respond to an opposing argument",
      "Concede one fair point from the other side",
    ],
    starterAI: "Okay, here's my view: I think screens are mostly harmful for young people. What do you think?",
    minCefr: "B2",
  },
  {
    key: "job_interview_pro",
    emoji: "🧑‍💼",
    name: "Entrevista profesional",
    world: "chat",
    setting: "Tienes una entrevista para una pasantía importante y hacen preguntas difíciles.",
    aiPersona: "reclutador/a profesional que hace preguntas de comportamiento y repregunta",
    kidRole: "candidato/a",
    objectives: [
      "Describe a strength with a concrete example",
      "Answer a question about a weakness honestly",
      "Explain how you handled a difficult situation",
      "Ask one thoughtful question about the role",
    ],
    starterAI: "Welcome. Let's begin: can you tell me about a time you faced a challenge and how you handled it?",
    minCefr: "B2",
  },
  {
    key: "resolve_misunderstanding",
    emoji: "🤝",
    name: "Resolver un malentendido",
    world: "chat",
    setting: "Un amigo está molesto contigo por algo que dijiste y quieres arreglar las cosas.",
    aiPersona: "amigo/a dolido/a que al principio está distante pero puede reconciliarse",
    kidRole: "amigo/a",
    objectives: [
      "Acknowledge how your friend feels",
      "Apologize sincerely",
      "Explain your side without making excuses",
      "Propose a way to make things right",
    ],
    starterAI: "Hey... look, I'm a bit upset about what you said yesterday. I didn't expect that from you.",
    minCefr: "B2",
  },
];

export function getScenario(key: string): ConversationScenario | undefined {
  return SCENARIOS.find((s) => s.key === key);
}
