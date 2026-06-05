"use client";

import { useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Si Sentry está habilitado, captura automáticamente vía global handler.
    // Aquí solo dejamos el log estructurado de respaldo.
    console.error("[app error]", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong glowColor="red" className="p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-3">💥</div>
        <h1 className="text-2xl font-extrabold mb-2">Algo se rompió</h1>
        <p className="text-sm text-ink-dim mb-2">
          No pude completar la operación. Reintenta o vuelve al inicio.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-ink-dim mb-6 opacity-50">
            Ref: {error.digest}
          </p>
        )}
        <div className="flex gap-3">
          <NeonButton variant="ghost-cyan" onClick={() => reset()} className="flex-1">
            Reintentar
          </NeonButton>
          <Link href="/profiles" className="flex-1">
            <NeonButton variant="primary" className="w-full">Ir a inicio</NeonButton>
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
