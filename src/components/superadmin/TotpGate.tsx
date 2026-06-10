"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

/**
 * Puerta TOTP del dashboard admin.
 *  - mode "setup"    : primera vez → muestra el QR para Google Authenticator y
 *                      pide el primer código para confirmar el enrolamiento.
 *  - mode "challenge": ya enrolado → solo pide el código de 6 dígitos.
 */
export function TotpGate({ mode }: { mode: "setup" | "challenge" }) {
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "setup") return;
    (async () => {
      const res = await fetch("/api/superadmin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setQr(j.qr);
        setSecret(j.secret);
      } else {
        setError(j.error ?? "No se pudo iniciar la configuración.");
      }
    })();
  }, [mode]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/superadmin/totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", code }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.reload();
      return;
    }
    const j = await res.json().catch(() => ({}));
    setError(j.error ?? "Código incorrecto.");
    setCode("");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-md p-8 text-center">
        <div className="text-4xl mb-3">🔐</div>
        <h1 className="text-2xl font-extrabold mb-1">Administración</h1>

        {mode === "setup" ? (
          <>
            <p className="text-sm text-ink-dim mb-5">
              Primera vez: escanea este código con <b>Google Authenticator</b> (o Authy /
              Microsoft Authenticator) y luego escribe el código de 6 dígitos que te muestra.
            </p>
            {qr ? (
              <div className="bg-white rounded-2xl p-3 inline-block mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="Código QR para Google Authenticator" width={220} height={220} />
              </div>
            ) : (
              <div className="text-sm text-ink-dim my-8">Generando código QR…</div>
            )}
            {secret && (
              <p className="text-[11px] text-ink-dim mb-4 break-all">
                ¿No puedes escanear? Ingresa esta clave manualmente: <b>{secret}</b>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-dim mb-5">
            Ingresa el código de 6 dígitos de tu app <b>Google Authenticator</b>.
          </p>
        )}

        <form onSubmit={verify} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-3 py-3 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none text-center text-2xl tracking-[0.5em] font-bold"
            required
          />
          {error && (
            <div className="text-sm text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg p-2.5">
              {error}
            </div>
          )}
          <NeonButton type="submit" loading={loading} className="w-full" size="lg">
            {mode === "setup" ? "Activar y entrar" : "Entrar"}
          </NeonButton>
        </form>
      </GlassCard>
    </main>
  );
}
