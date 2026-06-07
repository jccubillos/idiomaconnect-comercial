"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

const EXAMPLES = [
  "Present continuous · deportes",
  "Vocabulario de la familia",
  "Past simple · vacaciones",
  "Comida y restaurantes",
];

/**
 * FASE 2 — El profesor define el contexto institucional del curso.
 * Esto se inyecta en las lecciones de TODOS los alumnos de este curso,
 * sin afectar a familias ni a otros colegios.
 */
export function CourseContextForm({
  courseId,
  initialTheme,
  initialContext,
}: {
  courseId: string;
  initialTheme: string | null;
  initialContext: string | null;
}) {
  const [theme, setTheme] = useState(initialTheme ?? "");
  const [context, setContext] = useState(initialContext ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const r = await fetch("/api/courses/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, currentTheme: theme, currentContext: context }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Falló");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function clearAll() {
    setTheme("");
    setContext("");
    setSaving(true);
    setError(null);
    try {
      await fetch("/api/courses/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, currentTheme: null, currentContext: null }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard strong glowColor="green" className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🎯</span>
        <h3 className="font-extrabold">Tema de la semana</h3>
      </div>
      <p className="text-sm text-ink-dim mb-4">
        Alinea las lecciones de tus alumnos con lo que ves en clase. La IA usará esto al
        generar sus actividades. Déjalo vacío para volver al contenido general.
      </p>

      <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
        Título corto
      </label>
      <input
        value={theme}
        onChange={(e) => { setTheme(e.target.value); setSaved(false); }}
        placeholder="Ej: Present continuous · deportes"
        maxLength={120}
        className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-green focus:outline-none transition-colors mb-2"
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => { setTheme(ex); setSaved(false); }}
            className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-neon-green/50 text-ink-dim"
          >
            {ex}
          </button>
        ))}
      </div>

      <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
        Instrucción para la IA (opcional)
      </label>
      <textarea
        value={context}
        onChange={(e) => { setContext(e.target.value); setSaved(false); }}
        placeholder="Ej: Estamos en la unidad 3 del libro. Refuerza el uso de 'going to' para planes y vocabulario de deportes."
        maxLength={1000}
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-green focus:outline-none transition-colors mb-4 resize-none"
      />

      {error && <div className="text-sm text-neon-red mb-3">{error}</div>}
      {saved && <div className="text-sm text-neon-green mb-3">✓ Guardado. Se aplicará en las próximas lecciones.</div>}

      <div className="flex gap-3">
        <NeonButton variant="primary" onClick={save} loading={saving} className="flex-1">
          Guardar tema
        </NeonButton>
        {(initialTheme || initialContext) && (
          <NeonButton variant="ghost-cyan" onClick={clearAll} disabled={saving}>
            Quitar
          </NeonButton>
        )}
      </div>
    </GlassCard>
  );
}
