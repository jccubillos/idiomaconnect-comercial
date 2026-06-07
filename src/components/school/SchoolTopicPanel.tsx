"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

const MAX_LEN = 500;

const EXAMPLES = [
  "El verbo to be (am, is, are)",
  "Los animales en inglés",
  "El pasado simple (regular verbs)",
  "Las partes de la casa",
  "Comparativos: bigger, smaller…",
];

/**
 * Pantalla de entrada del mundo "Tema del Colegio".
 * El alumno escribe O habla el tema que está viendo en clase y, al confirmar,
 * navega a /lesson?world=school&topic=... que genera la lección personalizada.
 */
export function SchoolTopicPanel({
  kid,
}: {
  kid: { id: string; name: string; color_hex: string };
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await transcribe(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      setError("No pude acceder al micrófono. Revisa los permisos del navegador.");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "tema.webm");
      fd.append("kidId", kid.id);
      // El alumno habla en español el tema que ve en el colegio.
      fd.append("language", "es");
      const r = await fetch("/api/audio/transcribe", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "No pude transcribir el audio.");
      const heard = (data.text ?? "").trim();
      if (heard) {
        setText((prev) => (prev ? `${prev} ${heard}` : heard).slice(0, MAX_LEN));
      } else {
        setError("No te escuché bien. Intenta de nuevo o escríbelo.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTranscribing(false);
    }
  }

  function startLesson() {
    const topic = text.trim();
    if (!topic) {
      setError("Escribe o habla primero el tema del colegio.");
      return;
    }
    router.push(`/lesson?kid=${kid.id}&world=school&topic=${encodeURIComponent(topic)}`);
  }

  const accent = "#ffd23f";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">
          ← Worlds
        </Link>
        <div className="text-xs font-bold" style={{ color: accent }}>
          🎒 Tema del Colegio
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto relative z-10">
        <div
          className="text-center mb-6 rounded-2xl p-5 border"
          style={{
            borderColor: `${accent}66`,
            background: `radial-gradient(ellipse at 50% 0%, ${accent}1f 0%, transparent 70%)`,
          }}
        >
          <div className="text-5xl mb-2">🎒</div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: accent }}>
            ¿Qué estás viendo en el colegio?
          </h1>
          <p className="text-sm text-ink-dim">
            Dime el tema y te armo una lección y un quiz a tu medida, {kid.name}.
          </p>
        </div>

        {/* Entrada por texto */}
        <GlassCard className="p-4 mb-4">
          <label className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2 block">
            Escribe el tema
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            placeholder="Ej: el verbo to be, los animales, el pasado simple…"
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors resize-none"
          />
          <div className="text-right text-[11px] text-ink-dim mt-1">
            {text.length}/{MAX_LEN}
          </div>
        </GlassCard>

        {/* Entrada por voz */}
        <GlassCard className="p-4 mb-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-3">
            …o díctalo por voz
          </div>
          {transcribing ? (
            <div className="py-2">
              <div className="text-2xl mb-1 animate-pulse">🎙️</div>
              <p className="text-xs text-ink-dim">Escuchando lo que dijiste…</p>
            </div>
          ) : recording ? (
            <NeonButton variant="primary" size="lg" onClick={stopRecording} className="animate-pulse px-8">
              ■ Detener y usar
            </NeonButton>
          ) : (
            <NeonButton variant="ghost-green" size="lg" onClick={startRecording} className="px-8">
              ● Hablar el tema
            </NeonButton>
          )}
          <p className="text-xs text-ink-dim mt-3">Puedes decirlo en español.</p>
        </GlassCard>

        {/* Ejemplos rápidos */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2">
            💡 Ejemplos
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setText(ex)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 transition-colors text-ink-dim"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-neon-red mb-4 text-center">{error}</p>
        )}

        <NeonButton
          variant="primary"
          size="lg"
          onClick={startLesson}
          disabled={!text.trim() || transcribing}
          className="w-full"
        >
          ✨ Crear mi lección
        </NeonButton>
      </main>
    </>
  );
}
