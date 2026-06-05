import Groq from "groq-sdk";

let cached: Groq | null = null;

export function getGroqClient(): Groq {
  if (cached) return cached;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  cached = new Groq({ apiKey });
  return cached;
}

export const GROQ_MODELS = {
  chat: "llama-3.3-70b-versatile",
  whisper: "whisper-large-v3",
} as const;

export const GROQ_DEFAULTS = {
  temperature: 0.7,
  maxTokens: 4000,
} as const;
