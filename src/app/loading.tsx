import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5 relative z-10">
      <GlassCard strong className="p-8 text-center">
        <div className="text-4xl mb-3 animate-pulse">⚡</div>
        <p className="text-sm text-ink-dim">Cargando…</p>
      </GlassCard>
    </main>
  );
}
