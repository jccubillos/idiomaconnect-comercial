"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function SignupPage() {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [parentalConsent, setParentalConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptedTos || !parentalConsent) {
      setError("Debes aceptar los términos y otorgar consentimiento parental.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { family_name: familyName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Trigger handle_new_user() will create the family row.
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold mb-1">Crear cuenta familiar</h1>
        <p className="text-sm text-ink-dim mb-6">7 días gratis · sin tarjeta requerida.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
              Nombre de la familia
            </label>
            <input
              type="text"
              required
              placeholder="Familia Pérez"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
              Tu email (padre/madre)
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
              Contraseña (mín. 8 caracteres)
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-2 text-sm">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTos}
                onChange={(e) => setAcceptedTos(e.target.checked)}
                className="mt-1"
              />
              <span className="text-ink-dim">
                Acepto los{" "}
                <Link href="/terms" target="_blank" className="text-neon-cyan underline">Términos</Link>
                {" "}y la{" "}
                <Link href="/privacy" target="_blank" className="text-neon-cyan underline">Política de Privacidad</Link>.
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={parentalConsent}
                onChange={(e) => setParentalConsent(e.target.checked)}
                className="mt-1"
              />
              <span className="text-ink-dim">
                Soy padre, madre o tutor legal y autorizo el uso de IdiomaConnect
                para los menores de mi familia (consentimiento COPPA/GDPR-K).
              </span>
            </label>
          </div>

          {error && (
            <div className="text-sm text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg p-3">
              {error}
            </div>
          )}

          <NeonButton type="submit" loading={loading} className="w-full" size="lg">
            Crear cuenta
          </NeonButton>
        </form>

        <div className="mt-6 text-center text-sm text-ink-dim">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-neon-cyan font-bold hover:underline">
            Entrar
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
