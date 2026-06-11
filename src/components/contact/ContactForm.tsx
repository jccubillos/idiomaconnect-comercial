"use client";

import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

const REASONS = [
  { value: "soporte", label: "Soporte técnico (algo no funciona)" },
  { value: "pagos", label: "Pagos y suscripción" },
  { value: "colegios", label: "Colegios e instituciones" },
  { value: "sugerencia", label: "Sugerencia o idea" },
  { value: "otro", label: "Otro" },
];

export function ContactForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("soporte");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setError("El archivo supera los 5 MB. Comprímelo o envía uno más liviano.");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);
    fd.set("phone", phone);
    fd.set("reason", reason);
    fd.set("message", message);
    if (file) fd.set("file", file);

    const res = await fetch("/api/contact", { method: "POST", body: fd });
    setLoading(false);
    if (res.ok) {
      setSent(true);
      return;
    }
    const j = await res.json().catch(() => ({}));
    setError(j.error ?? "No se pudo enviar. Intenta de nuevo.");
  }

  if (sent) {
    return (
      <GlassCard strong className="p-8 text-center">
        <div className="text-5xl mb-3">📨</div>
        <h2 className="text-xl font-extrabold mb-2">¡Mensaje recibido!</h2>
        <p className="text-sm text-ink-dim">
          Gracias por escribirnos, <b>{name.split(" ")[0]}</b>. Pronto nos pondremos en
          contacto contigo al correo <b>{email}</b>.
        </p>
      </GlassCard>
    );
  }

  const field =
    "w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors text-sm";

  return (
    <GlassCard strong className="p-6 md:p-8">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
            Tu nombre *
          </label>
          <input className={field} required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
              Correo de tu cuenta *
            </label>
            <input className={field} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
              Teléfono
            </label>
            <input className={field} type="tel" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 ..." />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
            Motivo del contacto *
          </label>
          <select className={field} value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
            Cuéntanos en qué te ayudamos
          </label>
          <textarea className={`${field} min-h-[110px]`} maxLength={3000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe tu solicitud…" />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
            Adjuntar archivo (opcional)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            className="block w-full text-sm text-ink-dim file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-surface-mid file:text-on-surface file:font-bold file:cursor-pointer hover:file:bg-white/10"
          />
          <p className="text-[11px] text-ink-dim mt-1">
            {fileName ? `📎 ${fileName}` : "Imagen, PDF o Word · máximo 5 MB"}
          </p>
        </div>

        {error && (
          <div className="text-sm text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg p-3">
            {error}
          </div>
        )}

        <NeonButton type="submit" loading={loading} className="w-full" size="lg">
          Enviar mensaje
        </NeonButton>
      </form>
    </GlassCard>
  );
}
