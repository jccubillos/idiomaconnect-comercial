"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { LumiCharacter } from "@/components/coach/LumiCharacter";

/**
 * Botón de entrada al demo: pide una cuenta de prueba ya poblada al servidor,
 * inicia sesión con ella y entra a la app. Pensado para que el afiliado grabe.
 */
export function DemoEntry() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.email) {
        setError(data.error ?? "No se pudo abrir el demo. Intenta de nuevo.");
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signErr) {
        setError("No se pudo iniciar el demo. Intenta de nuevo.");
        setLoading(false);
        return;
      }
      router.push("/start");
      router.refresh();
    } catch {
      setError("No se pudo abrir el demo. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong glowColor="cyan" className="w-full max-w-md p-8 text-center border border-neon-cyan/40">
        <div className="flex justify-center mb-3">
          <LumiCharacter mood="greet" size={120} />
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-2">
          Demo para afiliados
        </div>
        <h1 className="text-2xl font-extrabold mb-2">Conoce la app por dentro</h1>
        <p className="text-sm text-ink-dim mb-6">
          Te abrimos una cuenta de prueba <b>ya lista</b>, con 2 niños y su avance, para que
          navegues y <b>grabes tu pantalla</b> mostrando IdiomaConnect. No necesitas configurar nada.
        </p>

        <ul className="text-left text-xs text-ink-dim space-y-1.5 mb-6 mx-auto max-w-xs">
          <li>✓ Lecciones personalizadas con los gustos del niño</li>
          <li>✓ Juegos, Battle, Arena Global, Reto y Duelo Familiar</li>
          <li>✓ Panel de padres con el avance por habilidad</li>
        </ul>

        {error && (
          <div className="text-sm text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <NeonButton variant="primary" size="lg" className="w-full" loading={loading} onClick={enter}>
          ▶️ Entrar al demo
        </NeonButton>

        <p className="text-[11px] text-ink-dim mt-4">
          Acceso de demostración para afiliados aprobados. Los datos son de ejemplo y se reinician.
        </p>
      </GlassCard>
    </main>
  );
}
