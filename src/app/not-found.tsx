import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-3">🛸</div>
        <h1 className="text-2xl font-extrabold mb-2">404 · Lost in the grid</h1>
        <p className="text-sm text-ink-dim mb-6">
          Esa página no existe (o ya no). Vuelve al hub.
        </p>
        <Link href="/profiles">
          <NeonButton variant="primary">Volver al inicio</NeonButton>
        </Link>
      </GlassCard>
    </main>
  );
}
