"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

const input =
  "w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors";
const label = "text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5";

export function SchoolLeadForm() {
  const [f, setF] = useState({
    institutionName: "", address: "", comuna: "", region: "",
    contactName: "", contactRole: "", phone: "", email: "",
    numStudents: "", levels: "", hasEnglishTeacher: "", message: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof typeof f>(k: K, v: string) { setF((p) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const payload: Record<string, unknown> = {
        institutionName: f.institutionName, address: f.address || undefined,
        comuna: f.comuna || undefined, region: f.region || undefined,
        contactName: f.contactName, contactRole: f.contactRole || undefined,
        phone: f.phone || undefined, email: f.email,
        numStudents: f.numStudents ? Number(f.numStudents) : undefined,
        levels: f.levels || undefined,
        hasEnglishTeacher: f.hasEnglishTeacher === "" ? undefined : f.hasEnglishTeacher === "si",
        message: f.message || undefined,
      };
      const r = await fetch("/api/school-leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Falló");
      setDone(true);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  if (done) {
    return (
      <GlassCard strong glowColor="green" className="p-8 text-center max-w-lg mx-auto">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-2xl font-extrabold mb-2">¡Solicitud enviada!</h2>
        <p className="text-sm text-ink-dim mb-6">
          Gracias por tu interés. Nuestro equipo se pondrá en contacto contigo a la brevedad
          para armar una propuesta a la medida de tu institución.
        </p>
        <Link href="/"><NeonButton variant="ghost-cyan">Volver al inicio</NeonButton></Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard strong className="p-6 md:p-8 max-w-2xl mx-auto">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={label}>Nombre de la institución *</label>
          <input className={input} required value={f.institutionName} onChange={(e) => set("institutionName", e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Dirección</label>
            <input className={input} value={f.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className={label}>Comuna</label>
            <input className={input} value={f.comuna} onChange={(e) => set("comuna", e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Región</label>
            <input className={input} value={f.region} onChange={(e) => set("region", e.target.value)} />
          </div>
          <div>
            <label className={label}>N° de alumnos requeridos</label>
            <input className={input} type="number" min={1} value={f.numStudents} onChange={(e) => set("numStudents", e.target.value)} />
          </div>
        </div>

        <hr className="border-white/10" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Nombre de contacto *</label>
            <input className={input} required value={f.contactName} onChange={(e) => set("contactName", e.target.value)} />
          </div>
          <div>
            <label className={label}>Cargo</label>
            <input className={input} placeholder="Ej: UTP, Jefe de inglés" value={f.contactRole} onChange={(e) => set("contactRole", e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Correo electrónico *</label>
            <input className={input} type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className={label}>Teléfono</label>
            <input className={input} value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Niveles</label>
            <select className={input} value={f.levels} onChange={(e) => set("levels", e.target.value)}>
              <option value="">Selecciona…</option>
              <option value="basica">Enseñanza básica</option>
              <option value="media">Enseñanza media</option>
              <option value="ambos">Básica y media</option>
            </select>
          </div>
          <div>
            <label className={label}>¿Tienen profesor de inglés?</label>
            <select className={input} value={f.hasEnglishTeacher} onChange={(e) => set("hasEnglishTeacher", e.target.value)}>
              <option value="">Selecciona…</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Mensaje (opcional)</label>
          <textarea className={`${input} resize-none`} rows={3} value={f.message} onChange={(e) => set("message", e.target.value)} placeholder="Cuéntanos qué buscas para tu colegio." />
        </div>

        {err && <div className="text-sm text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg p-3">{err}</div>}

        <NeonButton type="submit" loading={busy} size="lg" className="w-full">Enviar solicitud</NeonButton>
        <p className="text-xs text-ink-dim text-center">Te responderemos al correo indicado. Tus datos se usan solo para esta cotización.</p>
      </form>
    </GlassCard>
  );
}
