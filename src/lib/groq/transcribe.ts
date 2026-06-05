/**
 * Audio transcription via Groq Whisper.
 * Port of `transcribe_audio()` from main(3).py.
 */

import { getGroqClient, GROQ_MODELS } from "./client";

export async function transcribeAudio(
  audio: File | Blob,
  options: { language?: "en" | "es" } = {},
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const groq = getGroqClient();
    // groq-sdk expects a File-like with `.name`
    const file =
      audio instanceof File
        ? audio
        : new File([audio], "audio.webm", { type: audio.type || "audio/webm" });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: GROQ_MODELS.whisper,
      language: options.language,
      response_format: "json",
    });
    return { ok: true, text: transcription.text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[transcribeAudio]", err);
    return { ok: false, error: msg };
  }
}
