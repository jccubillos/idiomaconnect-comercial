"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NeonButton } from "@/components/ui/NeonButton";

export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function doDelete() {
    setLoading(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "BORRAR" }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Error eliminando la cuenta");
      return;
    }
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-neon-red underline hover:no-underline"
      >
        Eliminar cuenta y todos los datos
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        Escribe <b className="text-neon-red">BORRAR</b> para confirmar:
      </p>
      <input
        type="text"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-neon-red/40 focus:border-neon-red focus:outline-none"
      />
      <div className="flex gap-2">
        <NeonButton variant="ghost-cyan" onClick={() => setOpen(false)}>Cancelar</NeonButton>
        <button
          onClick={doDelete}
          disabled={confirm !== "BORRAR" || loading}
          className="flex-1 py-2.5 px-4 rounded-xl bg-neon-red text-white font-bold uppercase tracking-wide text-sm disabled:opacity-50"
        >
          {loading ? "Eliminando…" : "Eliminar para siempre"}
        </button>
      </div>
    </div>
  );
}
