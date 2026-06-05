"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

function BillingInner() {
  const params = useSearchParams();
  const canceled = params.get("canceled") === "1";
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  async function startCheckout(plan: "monthly" | "yearly") {
    setLoading(plan);
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else {
      alert(data.error ?? "Algo falló");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Family Plan</h1>
          <p className="text-ink-dim">Hasta 6 perfiles · todas las features · cancela cuando quieras</p>
          {canceled && (
            <p className="mt-4 text-sm text-neon-red">El checkout se canceló. Puedes intentar de nuevo.</p>
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
              Mejor valor · ahorras 34%
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2">Anual</div>
            <div className="text-4xl font-extrabold mb-1">$79</div>
            <div className="text-sm text-ink-dim mb-6">USD / año (~$6.58/mes)</div>
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
