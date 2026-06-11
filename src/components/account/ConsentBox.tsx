"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NeonButton } from "@/components/ui/NeonButton";

/**
 * Casilla simple para que cuentas antiguas registren su aceptación de términos
 * y consentimiento parental (las cuentas nuevas lo guardan al registrarse).
 */
export function ConsentBox() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/account/consent", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo guardar. Intenta de nuevo.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 p-4">
      <label className="flex items-start gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-1"
        />
        <span className="text-ink-dim">
          Acepto los <Link href="/terms" target="_blank" className="text-neon-cyan underline">Términos</Link> y
          la <Link href="/privacy" target="_blank" className="text-neon-cyan underline">Política de Privacidad</Link>,
          y declaro ser padre, madre o tutor legal de los menores de mi familia
          (consentimiento parental).
        </span>
      </label>
      {error && <p className="text-xs text-neon-red mt-2">{error}</p>}
      <div className="mt-3">
        <NeonButton size="sm" variant="ghost-cyan" loading={loading} disabled={!checked} onClick={accept}>
          Confirmar aceptación
        </NeonButton>
      </div>
    </div>
  );
}
