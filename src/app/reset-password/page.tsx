"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold mb-1">Resetear contraseña</h1>
        <p className="text-sm text-ink-dim mb-6">
          Te enviaremos un email con un enlace para cambiarla.
        </p>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-3">✉️</div>
            <p className="text-sm mb-6">
              Revisa <b>{email}</b>. Si la cuenta existe, recibirás el enlace en minutos.
            </p>
            <Link href="/login"><NeonButton variant="ghost-cyan">Volver a login</NeonButton></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none"
            />
            {error && <div className="text-sm text-neon-red">{error}</div>}
            <NeonButton type="submit" loading={loading} className="w-full" size="lg">
              Enviar enlace
            </NeonButton>
            <div className="text-center text-sm text-ink-dim">
              <Link href="/login" className="text-neon-cyan hover:underline">← Volver</Link>
            </div>
          </form>
        )}
      </GlassCard>
    </main>
  );
}
