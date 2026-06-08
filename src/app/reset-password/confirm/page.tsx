"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ConfirmResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("session") || m.includes("expired") || m.includes("invalid")) {
        setError("El enlace expiró o ya fue usado. Solicita uno nuevo desde '¿Olvidaste tu contraseña?'.");
      } else {
        setError(error.message);
      }
      return;
    }
    router.push("/start");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold mb-1">Nueva contraseña</h1>
        <p className="text-sm text-ink-dim mb-6">Elige una contraseña fuerte.</p>
        <form onSubmit={submit} className="space-y-4">
          <PasswordInput
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            aria-label="Nueva contraseña"
          />
          <PasswordInput
            placeholder="Confirmar contraseña"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            aria-label="Confirmar contraseña"
          />
          {error && (
            <div className="text-sm text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg p-3">
              {error}
            </div>
          )}
          <NeonButton type="submit" loading={loading} className="w-full" size="lg">Guardar</NeonButton>
        </form>
      </GlassCard>
    </main>
  );
}
