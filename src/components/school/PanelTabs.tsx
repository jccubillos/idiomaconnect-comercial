"use client";

import { useState } from "react";

/** Pestañas simples para paneles renderizados en servidor. */
export function PanelTabs({ tabs }: { tabs: Array<{ label: string; content: React.ReactNode }> }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              active === i ? "bg-neon-cyan text-surface" : "bg-surface-mid text-ink-dim hover:text-on-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs[active]?.content}
    </div>
  );
}
