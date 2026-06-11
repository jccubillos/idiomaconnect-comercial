"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { SCHOOL_TOOLS, DEFAULT_ENABLED_MODES } from "@/lib/content/school-world";

interface EvalRow {
  id: string;
  title: string;
  active: boolean;
}

/**
 * Panel del PROFESOR para personalizar "Lumi en tu Colegio" de su curso:
 *  · Mensaje para los alumnos (Lumi lo muestra: "Tu profesor dice…").
 *  · Herramientas activas (catálogo de 16 con su finalidad pedagógica).
 *  · Evaluaciones de entrenamiento (pega la materia → la IA genera la práctica).
 */
export function SchoolWorldManager({
  courseId,
  initialMessage,
  initialModes,
  evaluations,
}: {
  courseId: string;
  initialMessage: string | null;
  initialModes: string[] | null;
  evaluations: EvalRow[];
}) {
  const router = useRouter();

  /* ── Mensaje del profesor ── */
  const [message, setMessage] = useState(initialMessage ?? "");
  const [savingMsg, setSavingMsg] = useState(false);
  const [msgOk, setMsgOk] = useState<string | null>(null);

  async function saveMessage(e: React.FormEvent) {
    e.preventDefault();
    setSavingMsg(true);
    setMsgOk(null);
    const res = await fetch("/api/courses/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, worldMessage: message || null }),
    });
    setSavingMsg(false);
    setMsgOk(res.ok ? "✓ Guardado. Lumi se lo mostrará a tus alumnos." : "No se pudo guardar.");
  }

  /* ── Herramientas activas ── */
  const [modes, setModes] = useState<string[]>(
    initialModes && initialModes.length ? initialModes : DEFAULT_ENABLED_MODES,
  );
  const [savingModes, setSavingModes] = useState(false);
  const [modesOk, setModesOk] = useState<string | null>(null);

  function toggleMode(key: string) {
    setModesOk(null);
    setModes((m) => (m.includes(key) ? m.filter((x) => x !== key) : [...m, key]));
  }

  async function saveModes() {
    if (modes.length === 0) {
      setModesOk("Activa al menos una herramienta.");
      return;
    }
    setSavingModes(true);
    setModesOk(null);
    const res = await fetch("/api/courses/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, enabledModes: modes }),
    });
    setSavingModes(false);
    setModesOk(res.ok ? `✓ Guardado: ${modes.length} herramientas activas en el mundo.` : "No se pudo guardar.");
  }

  /* ── Evaluaciones ── */
  const [evTitle, setEvTitle] = useState("");
  const [evContent, setEvContent] = useState("");
  const [savingEv, setSavingEv] = useState(false);
  const [evMsg, setEvMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function createEval(e: React.FormEvent) {
    e.preventDefault();
    setSavingEv(true);
    setEvMsg(null);
    const res = await fetch("/api/courses/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, title: evTitle, content: evContent }),
    });
    const j = await res.json().catch(() => ({}));
    setSavingEv(false);
    if (!res.ok) return setEvMsg({ type: "err", text: j.error ?? "No se pudo crear." });
    setEvMsg({ type: "ok", text: "✓ Evaluación publicada en el mundo del curso." });
    setEvTitle("");
    setEvContent("");
    router.refresh();
  }

  async function toggleEval(id: string, active: boolean) {
    await fetch("/api/courses/evaluations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    router.refresh();
  }

  const field =
    "w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-purple focus:outline-none transition-colors text-sm";

  return (
    <GlassCard strong className="p-5 mb-6 border border-neon-purple/40">
      <h2 className="font-extrabold mb-1 flex items-center gap-2">
        🏫 Lumi en tu Colegio <span className="text-[10px] font-bold uppercase tracking-widest text-neon-purple bg-neon-purple/15 px-2 py-0.5 rounded-full">mundo del curso</span>
      </h2>
      <p className="text-xs text-ink-dim mb-5">
        El mundo exclusivo que ven tus alumnos. Personalízalo: tu mensaje, las herramientas
        disponibles y evaluaciones de entrenamiento.
      </p>

      {/* 1. Mensaje del profesor */}
      <form onSubmit={saveMessage} className="mb-6">
        <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
          💬 Mensaje para tus alumnos
        </label>
        <textarea
          className={`${field} min-h-[70px]`}
          maxLength={400}
          placeholder='Ej: "¡Equipo! Esta semana practiquen el pasado simple — la prueba es el viernes. ¡Ustedes pueden!"'
          value={message}
          onChange={(e) => { setMessage(e.target.value); setMsgOk(null); }}
        />
        <div className="flex items-center gap-3 mt-2">
          <NeonButton type="submit" size="sm" variant="ghost-cyan" loading={savingMsg}>Guardar mensaje</NeonButton>
          {msgOk && <span className="text-xs text-neon-green">{msgOk}</span>}
        </div>
        <p className="text-[11px] text-ink-dim mt-1.5">
          Lumi se lo mostrará así: “Tu profesor dice: …”
        </p>
      </form>

      {/* 2. Herramientas del mundo */}
      <div className="mb-6">
        <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
          🧰 Herramientas activas ({modes.length} de {SCHOOL_TOOLS.length})
        </label>
        <div className="grid sm:grid-cols-2 gap-2">
          {SCHOOL_TOOLS.map((t) => {
            const on = modes.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => toggleMode(t.key)}
                className={`text-left p-3 rounded-xl border transition-colors ${
                  on ? "border-neon-purple/60 bg-neon-purple/10" : "border-white/10 bg-surface-mid opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span>{t.emoji}</span>
                  <span className="flex-1">{t.name}</span>
                  <span className={`text-[10px] font-extrabold ${on ? "text-neon-green" : "text-ink-dim"}`}>
                    {on ? "ACTIVA" : "OFF"}
                  </span>
                </div>
                <p className="text-[11px] text-ink-dim mt-1">{t.teacherDesc}</p>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <NeonButton type="button" size="sm" variant="ghost-cyan" loading={savingModes} onClick={saveModes}>
            Guardar herramientas
          </NeonButton>
          {modesOk && <span className="text-xs text-neon-green">{modesOk}</span>}
        </div>
      </div>

      {/* 3. Evaluaciones de entrenamiento */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
          📋 Evaluaciones de entrenamiento
        </label>
        <p className="text-[11px] text-ink-dim mb-3">
          Pega la materia o las preguntas de tu próxima prueba: la IA generará práctica de
          entrenamiento con esos contenidos exactos dentro del mundo.
        </p>

        {evaluations.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {evaluations.map((ev) => (
              <div key={ev.id} className="flex items-center gap-2 text-sm border-b border-white/5 pb-1.5">
                <span>🎯</span>
                <span className={`flex-1 font-bold ${ev.active ? "" : "line-through text-ink-dim"}`}>{ev.title}</span>
                <button
                  onClick={() => toggleEval(ev.id, !ev.active)}
                  className={`text-xs underline hover:no-underline ${ev.active ? "text-neon-red" : "text-neon-green"}`}
                >
                  {ev.active ? "Desactivar" : "Reactivar"}
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={createEval} className="space-y-2">
          <input
            className={field}
            maxLength={120}
            required
            placeholder="Título (ej: Prueba unidad 3 · Pasado simple)"
            value={evTitle}
            onChange={(e) => setEvTitle(e.target.value)}
          />
          <textarea
            className={`${field} min-h-[90px]`}
            maxLength={4000}
            required
            placeholder="Pega aquí la materia, vocabulario o preguntas que entrará la evaluación…"
            value={evContent}
            onChange={(e) => setEvContent(e.target.value)}
          />
          {evMsg && (
            <div className={`text-xs rounded-lg p-2 ${evMsg.type === "ok" ? "text-neon-green bg-neon-green/10" : "text-neon-red bg-neon-red/10"}`}>
              {evMsg.text}
            </div>
          )}
          <NeonButton type="submit" size="sm" loading={savingEv}>Publicar evaluación</NeonButton>
        </form>
      </div>
    </GlassCard>
  );
}
