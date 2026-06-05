import { GlassCard } from "@/components/ui/GlassCard";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-3">📡</div>
        <h1 className="text-2xl font-extrabold mb-2">Sin conexión</h1>
        <p className="text-sm text-ink-dim mb-6">
          IdiomaConnect necesita internet para generar las lecciones.
          Vuelve cuando tengas señal — tu progreso está guardado.
        </p>
        <p className="text-xs text-ink-dim">
          Tip: la app funciona mejor en wifi para los modos con audio.
        </p>
      </GlassCard>
    </main>
  );
}
