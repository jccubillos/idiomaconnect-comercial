import Link from "next/link";

/**
 * Banner del período de prueba — contador regresivo visible y claro.
 *  - daysLeft 3+  → cian informativo.
 *  - daysLeft 1-2 → rojo urgente.
 *  - expired      → rojo: prueba terminada + aviso de retención de datos 30 días.
 */
export function TrialBanner({ daysLeft, expired }: { daysLeft: number | null; expired: boolean }) {
  if (expired) {
    return (
      <Link href="/billing?expired=1" className="block max-w-md mx-auto mb-6">
        <div className="rounded-2xl border border-neon-red/50 bg-neon-red/10 px-4 py-3 text-center hover:border-neon-red transition-colors">
          <div className="text-sm font-extrabold text-neon-red mb-0.5">⏰ Tu prueba gratis terminó</div>
          <div className="text-xs text-ink-dim">
            El progreso de tus niños queda guardado por <b>30 días</b>.
            <span className="text-neon-red font-bold"> Suscríbete para continuar →</span>
          </div>
        </div>
      </Link>
    );
  }

  if (daysLeft == null) return null;

  const urgent = daysLeft <= 2;
  return (
    <Link href="/billing" className="block max-w-md mx-auto mb-6">
      <div
        className={`rounded-2xl border px-4 py-2.5 text-center transition-colors ${
          urgent
            ? "border-neon-red/50 bg-neon-red/10 hover:border-neon-red"
            : "border-neon-cyan/40 bg-neon-cyan/10 hover:border-neon-cyan"
        }`}
      >
        <span className={`text-sm font-extrabold ${urgent ? "text-neon-red" : "text-neon-cyan"}`}>
          {urgent ? "⏰" : "🚀"} Prueba gratis: {daysLeft === 1 ? "queda 1 día" : `quedan ${daysLeft} días`}
        </span>
        <span className="text-xs text-ink-dim ml-2">Ver planes →</span>
      </div>
    </Link>
  );
}
