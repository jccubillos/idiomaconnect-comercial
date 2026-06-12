"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export interface SubInfo {
  plan: "family_monthly" | "family_yearly" | "family_plus" | "family_lifetime";
  status: string | null;
  hasPortal: boolean;
}

const SUB_PLAN_LABEL: Record<SubInfo["plan"], string> = {
  family_monthly: "Familiar Mensual (US$9,99/mes)",
  family_yearly: "Familiar Anual (US$89/año)",
  family_plus: "Familiar Plus (US$129/año)",
  family_lifetime: "Vitalicio 👑 (pago único)",
};

const STATUS_LABEL: Record<string, { text: string; tone: "ok" | "warn" }> = {
  active: { text: "✓ Activa · renovación automática", tone: "ok" },
  on_trial: { text: "✓ Activa (período de prueba del proveedor)", tone: "ok" },
  past_due: { text: "⚠️ Pago pendiente — actualiza tu tarjeta", tone: "warn" },
  unpaid: { text: "⚠️ Pago pendiente — actualiza tu tarjeta", tone: "warn" },
  cancelled: { text: "Cancelada · mantienes acceso hasta el fin del período pagado", tone: "warn" },
  expired: { text: "Expirada", tone: "warn" },
  lifetime: { text: "👑 Acceso de por vida — sin cobros futuros", tone: "ok" },
};

function BillingInner({ sub }: { sub: SubInfo | null }) {
  const params = useSearchParams();
  const canceled = params.get("canceled") === "1";
  const expired = params.get("expired") === "1";
  const portalIssue = params.get("portal"); // "none" | "unavailable"
  // Código de descuento que llega por link personalizado (ej. oferta 15% post-trial).
  const promo = params.get("promo") ?? undefined;
  const [loading, setLoading] = useState<"monthly" | "yearly" | "plus" | "lifetime" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: "monthly" | "yearly" | "plus" | "lifetime") {
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

  /* ── YA SUSCRITO: administración de la suscripción ─────────── */
  if (sub) {
    const st = STATUS_LABEL[sub.status ?? ""] ?? { text: sub.status ?? "—", tone: "ok" as const };
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <div className="max-w-md w-full">
          <GlassCard strong glowColor="cyan" className="p-8 text-center border border-neon-cyan/40">
            <div className="text-4xl mb-3">{sub.plan === "family_lifetime" ? "👑" : "💎"}</div>
            <h1 className="text-2xl font-extrabold mb-1">Tu suscripción</h1>
            <p className="text-sm text-ink-dim mb-5">Plan {SUB_PLAN_LABEL[sub.plan]}</p>
            <div
              className={`text-sm font-bold rounded-xl px-4 py-3 mb-6 ${
                st.tone === "ok"
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                  : "bg-neon-red/10 text-neon-red border border-neon-red/30"
              }`}
            >
              {st.text}
            </div>

            {sub.hasPortal ? (
              <a href="/api/payments/portal">
                <NeonButton variant="primary" size="lg" className="w-full">
                  Administrar pago · boletas · cancelar
                </NeonButton>
              </a>
            ) : (
              <p className="text-xs text-ink-dim">
                Para cambios en tu suscripción escríbenos a{" "}
                <a href="mailto:hola@idiomaconnect.com" className="text-neon-cyan underline">hola@idiomaconnect.com</a>.
              </p>
            )}

            {portalIssue && (
              <p className="text-xs text-neon-red mt-4">
                No pudimos abrir el portal de pagos en este momento. Intenta de nuevo en unos
                minutos o escríbenos a hola@idiomaconnect.com.
              </p>
            )}

            <p className="text-[11px] text-ink-dim mt-5">
              Al cancelar se detiene la renovación automática y mantienes el acceso hasta el
              término del período ya pagado (sin devolución proporcional).
            </p>
          </GlassCard>
        </div>
      </main>
    );
  }

  /* ── SIN SUSCRIPCIÓN: elegir plan ──────────────────────────── */
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
          {promo && (
            <div className="mt-5 max-w-md mx-auto rounded-2xl border border-neon-green/50 bg-neon-green/10 px-4 py-3">
              <p className="text-sm font-extrabold text-neon-green">🎉 Descuento {promo} listo para aplicarse</p>
              <p className="text-xs text-ink-dim">Se aplicará automáticamente al elegir tu plan.</p>
            </div>
          )}
          {error && (
            <div className="mt-5 max-w-md mx-auto rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-3 text-left">
              <p className="text-xs text-ink-dim">{error}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassCard className="p-6 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2">Mensual</div>
            <div className="text-4xl font-extrabold mb-1">$9.99</div>
            <div className="text-sm text-ink-dim mb-6">USD / mes</div>
            <NeonButton variant="ghost-cyan" loading={loading === "monthly"} onClick={() => startCheckout("monthly")} className="w-full">
              Contratar mensual
            </NeonButton>
          </GlassCard>

          <GlassCard className="p-6 text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-white/15 text-on-surface px-2 py-0.5 rounded-full">
              Ahorras 26%
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2">Anual</div>
            <div className="text-4xl font-extrabold mb-1">$89</div>
            <div className="text-sm text-ink-dim mb-6">USD / año (~$7.42/mes)</div>
            <NeonButton variant="ghost-cyan" loading={loading === "yearly"} onClick={() => startCheckout("yearly")} className="w-full">
              Contratar anual
            </NeonButton>
          </GlassCard>

          <GlassCard strong glowColor="cyan" className="p-6 text-center relative border-2 border-neon-cyan/60">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-neon-cyan text-surface px-2 py-0.5 rounded-full">
              ⭐ Recomendado
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-2">Plus anual</div>
            <div className="text-4xl font-extrabold mb-1">$129</div>
            <div className="text-sm text-ink-dim mb-2">USD / año (~$10.75/mes)</div>
            <p className="text-[11px] text-ink-dim mb-4">
              🏆 Arena Global · ⚔️ Reto a un amigo · 🥊 Duelo Familiar
            </p>
            <NeonButton variant="primary" loading={loading === "plus"} onClick={() => startCheckout("plus")} className="w-full">
              Contratar Plus
            </NeonButton>
          </GlassCard>

          <GlassCard glowColor="purple" className="p-6 text-center relative border border-neon-purple/50">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-neon-purple text-surface px-2 py-0.5 rounded-full">
              👑 Mejor inversión
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-neon-purple mb-2">Vitalicia</div>
            <div className="text-4xl font-extrabold mb-1">$299</div>
            <div className="text-sm text-ink-dim mb-2">USD · pago único</div>
            <p className="text-[11px] text-ink-dim mb-4">
              Plus para siempre + todas las actualizaciones futuras
            </p>
            <NeonButton variant="ghost-cyan" loading={loading === "lifetime"} onClick={() => startCheckout("lifetime")} className="w-full">
              Contratar de por vida
            </NeonButton>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}

export function BillingClient({ sub }: { sub: SubInfo | null }) {
  return (
    <Suspense fallback={null}>
      <BillingInner sub={sub} />
    </Suspense>
  );
}
