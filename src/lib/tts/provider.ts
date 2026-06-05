/**
 * TTS abstraction. Default provider = OpenAI (`tts-1`).
 * Switch by setting TTS_PROVIDER env var.
 *
 * Returned audio is a stream-able ArrayBuffer (mpeg).
 */

import OpenAI from "openai";

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

interface TTSOptions {
  text: string;
  voice?: TTSVoice;
  format?: "mp3" | "opus" | "aac";
  speed?: number;          // 0.25 .. 4.0
}

let cachedOpenAI: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (cachedOpenAI) return cachedOpenAI;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  cachedOpenAI = new OpenAI({ apiKey: key });
  return cachedOpenAI;
}

/**
 * Strip Markdown so the audio sounds like prose, not like code-fenced YAML.
 * Mirrors `_strip_markdown` in main(3).py.
 */
export function stripMarkdownForTTS(text: string): string {
  return text
    .replace(/`{1,3}[^`]*`{1,3}/g, "")        // inline/block code
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")        // links
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")       // images
    .replace(/[#>*_~]/g, "")                    // md punctuation
    .replace(/^\s*[-•]\s+/gm, "")               // bullets
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function synthesizeSpeech({
  text,
  voice = "nova",
  format = "mp3",
  speed = 0.95,
}: TTSOptions): Promise<ArrayBuffer> {
  const clean = stripMarkdownForTTS(text).slice(0, 4000); // hard cap
  if (!clean) throw new Error("Empty TTS input");

  const openai = getOpenAI();
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: clean,
    response_format: format,
    speed,
  });

  return await response.arrayBuffer();
}
