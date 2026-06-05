"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export default function ConfirmResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Mínimo 8 caracteres");
    if (password !== confirm) return setError("Las contraseñas no coinciden");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/profiles");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold mb-1">Nueva contraseña</h1>
        <p className="text-sm text-ink-dim mb-6">Elige una contraseña fuerte.</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirmar"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none"
          />
          {error && <div className="text-sm text-neon-red">{error}</div>}
          <NeonButton type="submit" loading={loading} className="w-full" size="lg">Guardar</NeonButton>
        </form>
      </GlassCard>
    </main>
  );
}
