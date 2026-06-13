"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

/**
 * Programa de referidos: "regala un mes, gana un mes". Cada familia tiene un
 * código/link que comparte; convierte a tus propios clientes en micro-afiliados.
 */
export function ReferralCard({ initialCode, appUrl }: { initialCode: string | null; appUrl: string }) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = code ? `${appUrl}/signup?ref=${code}` : null;

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/referral", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (j.code) setCode(j.code);
  }

  const shareText = `🎁 Te regalo un mes de IdiomaConnect, el tutor de inglés con IA para niños. Mis hijos lo aman. Úsalo aquí: ${link}`;

  return (
    <GlassCard className="p-4 border border-neon-green/30">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🎁</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm mb-0.5">Invita y ganen los dos</h3>
          <p className="text-xs text-ink-dim mb-3">
            Comparte tu link: tu amigo recibe un mes y, cuando contrate, <b>tú ganas un mes gratis</b>.
          </p>

          {!link ? (
            <NeonButton size="sm" variant="ghost-cyan" loading={loading} onClick={generate}>
              Crear mi link de invitación
            </NeonButton>
          ) : (
            <div className="flex flex-wrap gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                <NeonButton size="sm" variant="primary">📱 Compartir por WhatsApp</NeonButton>
              </a>
              <NeonButton
                size="sm"
                variant="ghost-cyan"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "✓ Copiado" : "📋 Copiar link"}
              </NeonButton>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
