import { Fragment } from "react";
import Link from "next/link";
import type { CEFRLevel } from "@/lib/supabase/database.types";
import type { SenderoStation, StationState } from "@/lib/content/sendero";
import { LumiCharacter } from "@/components/coach/LumiCharacter";

const LEVEL_META: Record<CEFRLevel, { color: string; label: string }> = {
  A1: { color: "#00eefc", label: "Nivel A1 · Fundamentos" },
  A2: { color: "#39ff14", label: "Nivel A2 · Básico" },
  B1: { color: "#c464ff", label: "Nivel B1 · Intermedio" },
  B2: { color: "#ff66c4", label: "Nivel B2 · Intermedio-Alto" },
  C1: { color: "#ffd23f", label: "Nivel C1 · Avanzado" },
  C2: { color: "#ffd23f", label: "Nivel C2 · Dominio" },
};

/**
 * Mapa del Sendero — camino cósmico vertical de 34 estaciones (currículo CEFR).
 * Estaciones alternadas a izquierda/derecha de una espina dorsal de neón, agrupadas
 * por nivel. La estación actual pulsa y muestra a Lumi + "Continuar".
 */
export function SenderoMap({ stations, kidId }: { stations: SenderoStation[]; kidId: string }) {
  return (
    <div className="relative max-w-md mx-auto">
      {/* Espina dorsal continua (degradado por niveles) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-[3px] rounded-full opacity-60"
        style={{ background: "linear-gradient(to bottom, #00eefc, #39ff14, #c464ff, #ff66c4, #ffd23f)" }}
      />
      <div className="relative flex flex-col gap-2">
        {stations.map((st, i) => {
          const showHeader = i === 0 || stations[i - 1].unit.level !== st.unit.level;
          const side: "left" | "right" = i % 2 === 0 ? "left" : "right";
          return (
            <Fragment key={st.unit.id}>
              {showHeader && <LevelHeader level={st.unit.level} />}
              <StationRow station={st} side={side} kidId={kidId} />
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function LevelHeader({ level }: { level: CEFRLevel }) {
  const meta = LEVEL_META[level];
  return (
    <div className="relative z-10 flex justify-center my-3">
      <span
        className="text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur"
        style={{ color: meta.color, background: `${meta.color}1a`, border: `1px solid ${meta.color}55` }}
      >
        {meta.label}
      </span>
    </div>
  );
}

function StationRow({
  station,
  side,
  kidId,
}: {
  station: SenderoStation;
  side: "left" | "right";
  kidId: string;
}) {
  const node = <StationNode station={station} kidId={kidId} />;
  const label = <StationLabel station={station} side={side} />;
  return (
    <div className="grid grid-cols-2 items-center min-h-[78px]">
      {side === "left" ? (
        <>
          <div className="flex justify-end pr-3">{node}</div>
          <div className="flex justify-start pl-3">{label}</div>
        </>
      ) : (
        <>
          <div className="flex justify-end pr-3">{label}</div>
          <div className="flex justify-start pl-3">{node}</div>
        </>
      )}
    </div>
  );
}

function StationNode({ station, kidId }: { station: SenderoStation; kidId: string }) {
  const meta = LEVEL_META[station.unit.level];
  const color = meta.color;
  const { state, number } = station;

  const base = "relative flex items-center justify-center rounded-full font-extrabold transition-transform";
  const sizes = state === "current" ? "w-16 h-16 text-lg" : "w-14 h-14 text-base";

  let inner: React.ReactNode;
  let style: React.CSSProperties;
  if (state === "completed") {
    inner = <span className="text-surface">✓</span>;
    style = { background: color, border: `2px solid ${color}`, boxShadow: `0 0 14px ${color}88` };
  } else if (state === "current") {
    inner = <span style={{ color }}>{number}</span>;
    style = { background: `${color}22`, border: `3px solid ${color}`, boxShadow: `0 0 22px ${color}` };
  } else if (state === "available") {
    inner = <span style={{ color }}>{number}</span>;
    style = { background: `${color}12`, border: `2px solid ${color}66` };
  } else {
    inner = <span className="text-ink-dim opacity-70">🔒</span>;
    style = { background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.10)" };
  }

  const orb = (
    <div className={`${base} ${sizes} ${state === "current" ? "animate-pulse hover:scale-105" : state !== "locked" ? "hover:scale-105" : ""}`} style={style}>
      {inner}
      {state === "current" && (
        <div className="absolute -top-2 -right-2">
          <LumiCharacter mood="suggest" size={34} />
        </div>
      )}
    </div>
  );

  if (state === "locked") return orb;
  return (
    <Link href={`/lesson?kid=${kidId}&world=grammar&unit=${station.unit.id}`} aria-label={`Unidad ${number}: ${station.unit.title}`}>
      {orb}
    </Link>
  );
}

function StationLabel({ station, side }: { station: SenderoStation; side: "left" | "right" }) {
  const meta = LEVEL_META[station.unit.level];
  const { state, unit } = station;
  const align = side === "left" ? "text-left" : "text-right";
  if (state === "locked") {
    return (
      <div className={`${align} max-w-[150px]`}>
        <div className="text-xs text-ink-dim opacity-50 truncate">{unit.title}</div>
      </div>
    );
  }
  return (
    <div className={`${align} max-w-[155px]`}>
      <div className="text-sm font-bold truncate" style={state === "current" ? { color: meta.color } : undefined}>
        {unit.title}
      </div>
      {state === "current" ? (
        <div className="text-xs font-extrabold mt-0.5" style={{ color: meta.color }}>
          Continuar →
        </div>
      ) : state === "completed" ? (
        <div className="text-[11px] text-neon-green">✓ Completada</div>
      ) : (
        <div className="text-[11px] text-ink-dim">Disponible</div>
      )}
    </div>
  );
}
