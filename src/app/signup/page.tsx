"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { PasswordInput } from "@/components/ui/PasswordInput";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Intención de compra desde la landing: tras crear la cuenta va directo al pago.
  const buyPlan = params.get("plan") === "monthly" || params.get("plan") === "yearly"
    ? (params.get("plan") as "monthly" | "yearly")
    : null;
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [parentalConsent, setParentalConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { family_name: familyName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setError(translateAuthError(error.message));
      return;
    }

    // Trigger handle_new_user() crea la fila de familia automáticamente.
    if (data.session) {
      // Con intención de compra → directo al pago; si no, al onboarding normal.
      router.push(buyPlan ? `/billing?plan=${buyPlan}` : "/onboarding");
      router.refresh();
    } else {
      // Confirmación de email ACTIVADA → no hay sesión hasta confirmar el correo.
      setInfo(
        "¡Cuenta creada! Te enviamos un correo de confirmación. Ábrelo y haz clic en el enlace para activar tu cuenta. Si no llega en unos minutos, revisa la carpeta de spam.",
      );
    }
  }

  /** Traduce los mensajes de error de Supabase (en inglés) a español claro. */
  function translateAuthError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes("already registered") || m.includes("already exists")) {
      return "Ese correo ya tiene una cuenta. Intenta iniciar sesión.";
    }
    if (m.includes("invalid email")) return "El correo no es válido.";
    if (m.includes("password")) return "La contraseña debe tener al menos 8 caracteres.";
    if (m.includes("rate limit") || m.includes("too many")) {
      return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
    }
    return msg;
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold mb-1">Crear cuenta familiar</h1>
        {buyPlan ? (
          <p className="text-sm text-ink-dim mb-6">
            Estás contratando el <b className="text-neon-cyan">plan {buyPlan === "yearly" ? "anual (US$79/año)" : "mensual (US$9.99/mes)"}</b>.
            Primero crea tu cuenta (1 minuto) y luego pasas al pago seguro.
          </p>
        ) : (
          <p className="text-sm text-ink-dim mb-6">7 días gratis · sin tarjeta requerida.</p>
        )}

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
            <PasswordInput
              required
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              aria-label="Contraseña"
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
          {info && (
            <div className="text-sm text-neon-green bg-neon-green/10 border border-neon-green/30 rounded-lg p-3">
              {info}
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

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
