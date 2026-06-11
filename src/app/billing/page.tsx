"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

function BillingInner() {
  const params = useSearchParams();
  const canceled = params.get("canceled") === "1";
  const expired = params.get("expired") === "1";
  // Código de descuento que llega por link personalizado (ej. oferta 15% post-trial).
  const promo = params.get("promo") ?? undefined;
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: "monthly" | "yearly") {
    setError(null);
    setLoading(plan);
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, discountCode: promo }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError(
      "El sistema de pagos está en su configuración final y se activará muy pronto. " +
      "Mientras tanto puedes usar la prueba gratis, o escribirnos a hola@idiomaconnect.com para contratar.",
    );
    setLoading(null);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Plan Familiar</h1>
          <p className="text-ink-dim">Hasta 6 perfiles · todas las funciones · cancela cuando quieras</p>
          {expired && (
            <div className="mt-5 max-w-md mx-auto rounded-2xl border border-neon-red/50 bg-neon-red/10 px-4 py-3">
              <p className="text-sm font-extrabold text-neon-red mb-1">⏰ Tu prueba gratis de 7 días terminó</p>
              <p className="text-xs text-ink-dim">
                No te preocupes: <b>el progreso de tus niños queda guardado por 30 días</b>.
                Suscríbete y retoman exactamente donde quedaron — XP, niveles, rachas y trofeos intactos.
              </p>
            </div>
          )}
          {canceled && (
            <p className="mt-4 text-sm text-neon-red">El pago se canceló. Puedes intentar de nuevo cuando quieras.</p>
          )}
          {error && (
            <div className="mt-5 max-w-md mx-auto rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-3 text-left">
              <p className="text-xs text-ink-dim">{error}</p>
            </div>
          )}
          {promo && (
            <div className="mt-5 max-w-md mx-auto rounded-2xl border border-neon-green/50 bg-neon-green/10 px-4 py-3">
              <p className="text-sm font-extrabold text-neon-green">🎉 Descuento {promo} listo para aplicarse</p>
              <p className="text-xs text-ink-dim">Se aplicará automáticamente al elegir tu plan.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassCard className="p-6 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2">Mensual</div>
            <div className="text-4xl font-extrabold mb-1">$9.99</div>
            <div className="text-sm text-ink-dim mb-6">USD / mes</div>
            <NeonButton variant="ghost-cyan" loading={loading === "monthly"} onClick={() => startCheckout("monthly")} className="w-full">
              Empezar plan mensual
            </NeonButton>
          </GlassCard>

          <GlassCard strong glowColor="cyan" className="p-6 text-center relative border border-neon-cyan/40">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-neon-cyan text-surface px-2 py-0.5 rounded-full">
              Mejor valor · ahorras 26%
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2">Anual</div>
            <div className="text-4xl font-extrabold mb-1">$89</div>
            <div className="text-sm text-ink-dim mb-6">USD / año (~$7.42/mes)</div>
            <NeonButton variant="primary" loading={loading === "yearly"} onClick={() => startCheckout("yearly")} className="w-full">
              Empezar plan anual
            </NeonButton>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingInner />
    </Suspense>
  );
}
