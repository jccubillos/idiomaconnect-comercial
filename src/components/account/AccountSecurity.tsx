"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { PasswordInput } from "@/components/ui/PasswordInput";

/**
 * Sección de seguridad del panel de Settings. Dos claves DISTINTAS:
 *  1. Clave de acceso (login): para entrar a la app en el dispositivo.
 *  2. Clave del dashboard de padres: protege el panel de progreso/facturación.
 */
export function AccountSecurity({ hasPin }: { hasPin: boolean }) {
  return (
    <>
      <ChangeLoginPassword />
      <SetParentPin hasPin={hasPin} />
    </>
  );
}

/* ── 1. Cambiar la clave de ACCESO (login de la cuenta) ─────────────── */
function ChangeLoginPassword() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pwd.length < 8) return setMsg({ type: "err", text: "La contraseña debe tener al menos 8 caracteres." });
    if (pwd !== confirm) return setMsg({ type: "err", text: "Las contraseñas no coinciden." });
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) return setMsg({ type: "err", text: error.message });
    setPwd(""); setConfirm("");
    setMsg({ type: "ok", text: "✓ Clave de acceso actualizada." });
  }

  return (
    <GlassCard strong className="p-6 mb-4">
      <h2 className="font-bold mb-1">🔑 Clave de acceso</h2>
      <p className="text-xs text-ink-dim mb-4">
        Es la que usan todos en el dispositivo para entrar a la app y elegir un perfil.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <PasswordInput value={pwd} onChange={setPwd} autoComplete="new-password" placeholder="Nueva clave de acceso" aria-label="Nueva clave de acceso" />
        <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Confirmar clave" aria-label="Confirmar clave" />
        {msg && (
          <div className={`text-sm rounded-lg p-2.5 ${msg.type === "ok" ? "text-neon-green bg-neon-green/10 border border-neon-green/30" : "text-neon-red bg-neon-red/10 border border-neon-red/30"}`}>
            {msg.text}
          </div>
        )}
        <NeonButton type="submit" loading={loading} variant="ghost-cyan" size="sm">Cambiar clave de acceso</NeonButton>
      </form>
    </GlassCard>
  );
}

/* ── 2. Configurar la clave del DASHBOARD de padres ─────────────────── */
function SetParentPin({ hasPin }: { hasPin: boolean }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(hasPin);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pin.length < 4) return setMsg({ type: "err", text: "El PIN debe tener al menos 4 caracteres." });
    if (pin !== confirm) return setMsg({ type: "err", text: "Los PIN no coinciden." });
    setLoading(true);
    const res = await fetch("/api/parent/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return setMsg({ type: "err", text: j.error ?? "No se pudo guardar el PIN." });
    }
    setPin(""); setConfirm(""); setDone(true);
    setMsg({ type: "ok", text: "✓ Clave del dashboard de padres guardada." });
  }

  return (
    <GlassCard strong className="p-6 mb-4">
      <h2 className="font-bold mb-1">👨‍👩‍👧 Clave del dashboard de padres</h2>
      <p className="text-xs text-ink-dim mb-1">
        Protege el panel con el progreso y la facturación. <b>Debe ser distinta</b> de la clave de acceso,
        para que los niños no puedan abrir el panel de padres.
      </p>
      <p className="text-xs mb-4">
        {done
          ? <span className="text-neon-green">● Ya tienes una clave del dashboard configurada.</span>
          : <span className="text-neon-red">● Aún usas la clave por defecto. Configura la tuya ahora.</span>}
      </p>
      <form onSubmit={submit} className="space-y-3">
        <PasswordInput value={pin} onChange={setPin} autoComplete="new-password" placeholder={done ? "Nuevo PIN del dashboard" : "PIN del dashboard"} aria-label="PIN del dashboard" />
        <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Confirmar PIN" aria-label="Confirmar PIN" />
        {msg && (
          <div className={`text-sm rounded-lg p-2.5 ${msg.type === "ok" ? "text-neon-green bg-neon-green/10 border border-neon-green/30" : "text-neon-red bg-neon-red/10 border border-neon-red/30"}`}>
            {msg.text}
          </div>
        )}
        <NeonButton type="submit" loading={loading} variant="ghost-cyan" size="sm">
          {done ? "Cambiar PIN del dashboard" : "Guardar PIN del dashboard"}
        </NeonButton>
      </form>
    </GlassCard>
  );
}
