import type { CoachMood } from "@/lib/coach/coach";

/**
 * LUMI CHARACTER — el personaje, reutilizable a cualquier tamaño y expresión.
 * Se usa en la tarjeta del coach (pantalla principal) y en la landing (antes del
 * registro), para darle presencia consistente en toda la app.
 *
 * Las ilustraciones de Stitch vienen como mockups 768×1376 con fondo oscuro; se
 * recortan al personaje con object-cover + un object-position por expresión.
 */

const MOOD_IMG: Record<CoachMood, string> = {
  greet: "/lumi/greet.png",      // saludo amistoso
  suggest: "/lumi/wink.png",     // guiño juguetón ("sigamos")
  encourage: "/lumi/encourage.png", // pulgar arriba
  celebrate: "/lumi/celebrate.png", // confeti / fiesta
};

// Encuadre del recorte por expresión. Todas las imágenes vienen limpias y centradas.
const MOOD_POS: Record<CoachMood, string> = {
  greet: "center 42%",
  suggest: "center 42%",
  encourage: "center 40%",
  celebrate: "center 48%",
};

export const LUMI_ACCENT: Record<CoachMood, string> = {
  greet: "#00eefc",
  suggest: "#00eefc",
  encourage: "#39ff14",
  celebrate: "#ffd23f",
};

export function LumiCharacter({
  mood = "greet",
  size = 76,
  className = "",
}: {
  mood?: CoachMood;
  size?: number;
  className?: string;
}) {
  const accent = LUMI_ACCENT[mood];
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div
        className="absolute -inset-1.5 blur-lg animate-pulse"
        style={{ background: accent, opacity: 0.35, borderRadius: size * 0.28 }}
      />
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: size * 0.22,
          border: `2px solid ${accent}`,
          boxShadow: `0 0 ${Math.round(size / 4)}px ${accent}55`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MOOD_IMG[mood]}
          alt={`Lumi (${mood})`}
          className="w-full h-full object-cover"
          style={{ objectPosition: MOOD_POS[mood] }}
        />
      </div>
    </div>
  );
}
