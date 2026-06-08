"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/start";
  const justConfirmed = params.get("confirmed") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(translateLoginError(error.message));
      return;
    }
    router.push(next);
    router.refresh();
  }

  /** Traduce los mensajes de error de login (en inglés) a español claro. */
  function translateLoginError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes("email not confirmed") || m.includes("not confirmed")) {
      return "Tu cuenta aún no está confirmada. Revisa tu correo y haz clic en el enlace de confirmación. Si no llega, contáctanos.";
    }
    if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
      return "Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.";
    }
    if (m.includes("rate limit") || m.includes("too many")) {
      return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
    }
    return msg;
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold mb-1">Entrar</h1>
        <p className="text-sm text-ink-dim mb-6">Accede a la cuenta de tu familia.</p>

        {justConfirmed && (
          <div className="text-sm text-neon-green bg-neon-green/10 border border-neon-green/30 rounded-lg p-3 mb-4">
            ✓ ¡Tu cuenta quedó confirmada! Ingresa con tu correo y contraseña.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors"
            />
          </div>
          {error && (
            <div className="text-sm text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg p-3">
              {error}
            </div>
          )}
          <NeonButton type="submit" loading={loading} className="w-full" size="lg">
            Entrar
          </NeonButton>
          <div className="text-center text-xs">
            <Link href="/reset-password" className="text-ink-dim hover:text-neon-cyan">¿Olvidaste tu contraseña?</Link>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-ink-dim">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="text-neon-cyan font-bold hover:underline">
            Crear cuenta
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
