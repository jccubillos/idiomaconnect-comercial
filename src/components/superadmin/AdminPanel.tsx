"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export interface AccountRow {
  id: string;
  name: string;
  email: string;
  plan: string;
  orgType: string;
  trialEndsAt: string;
  paymentFailedAt: string | null;
  createdAt: string;
}
export interface CodeRow {
  id: string;
  code: string;
  percent: number;
  duration: string;
  durationMonths: number | null;
  maxRedemptions: number;
  expiresAt: string | null;
  active: boolean;
  note: string | null;
}
export interface RegistryRow {
  email: string;
  firstTrialAt: string;
  retrialAuthorized: boolean;
}
export interface LeadRow {
  id: string;
  institution: string;
  contact: string;
  email: string;
  phone: string | null;
  students: number | null;
  status: string;
  createdAt: string;
}

const PLAN_LABEL: Record<string, string> = {
  trial: "Prueba",
  family_monthly: "Familiar mensual",
  family_yearly: "Familiar anual",
  school: "Colegio",
  expired: "Expirada",
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-CL") : "—");

type Tab = "cuentas" | "codigos" | "retrial" | "leads";

export function AdminPanel({
  accounts,
  codes,
  registry,
  leads,
}: {
  accounts: AccountRow[];
  codes: CodeRow[];
  registry: RegistryRow[];
  leads: LeadRow[];
}) {
  const [tab, setTab] = useState<Tab>("cuentas");
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "cuentas", label: `👨‍👩‍👧 Cuentas (${accounts.length})` },
    { key: "codigos", label: `🎟 Códigos (${codes.filter((c) => c.active).length})` },
    { key: "retrial", label: "🔁 Re-trials" },
    { key: "leads", label: `🏫 Leads (${leads.filter((l) => l.status === "new").length})` },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === t.key ? "bg-neon-cyan text-surface" : "bg-surface-mid text-ink-dim hover:text-on-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cuentas" && <AccountsTab accounts={accounts} />}
      {tab === "codigos" && <CodesTab codes={codes} />}
      {tab === "retrial" && <RetrialTab registry={registry} />}
      {tab === "leads" && <LeadsTab leads={leads} />}
    </div>
  );
}

/* ── Cuentas ──────────────────────────────────────────────── */
function AccountsTab({ accounts }: { accounts: AccountRow[] }) {
  const [q, setQ] = useState("");
  const list = accounts.filter(
    (a) =>
      !q ||
      a.email.toLowerCase().includes(q.toLowerCase()) ||
      a.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <GlassCard strong className="p-5">
      <input
        type="text"
        placeholder="Buscar por correo o nombre…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full mb-4 px-3 py-2 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none text-sm"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-dim border-b border-white/10">
              <th className="py-2 pr-3">Cuenta</th>
              <th className="py-2 pr-3">Correo</th>
              <th className="py-2 pr-3">Plan</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2">Creada</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => {
              const trialLeft = Math.ceil((new Date(a.trialEndsAt).getTime() - Date.now()) / 86_400_000);
              const estado =
                a.paymentFailedAt ? "💳 Pago fallido"
                : a.plan === "trial" ? (trialLeft > 0 ? `⏳ ${trialLeft} día(s)` : "Vencida")
                : a.plan === "expired" ? "Sin acceso"
                : "✓ Activa";
              return (
                <tr key={a.id} className="border-b border-white/5">
                  <td className="py-2 pr-3 font-bold">{a.name}{a.orgType === "school" ? " 🏫" : ""}</td>
                  <td className="py-2 pr-3 text-ink-dim">{a.email}</td>
                  <td className="py-2 pr-3">{PLAN_LABEL[a.plan] ?? a.plan}</td>
                  <td className="py-2 pr-3">{estado}</td>
                  <td className="py-2 text-ink-dim">{fmt(a.createdAt)}</td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-ink-dim">Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ── Códigos de descuento ─────────────────────────────────── */
function CodesTab({ codes }: { codes: CodeRow[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(15);
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">("once");
  const [months, setMonths] = useState(3);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresDays, setExpiresDays] = useState<number | "">(30);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/superadmin/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        percent,
        duration,
        durationMonths: duration === "repeating" ? months : undefined,
        maxRedemptions: maxUses,
        expiresDays: expiresDays === "" ? null : expiresDays,
        note: note || undefined,
      }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setMsg({ type: "err", text: j.error ?? "No se pudo crear." });
    setMsg({ type: "ok", text: `✓ Código ${j.code} creado.` });
    setCode(""); setNote("");
    router.refresh();
  }

  async function deactivate(id: string, c: string) {
    if (!confirm(`¿Desactivar el código ${c}? Dejará de funcionar en el checkout.`)) return;
    await fetch("/api/superadmin/codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  const field = "px-3 py-2 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none text-sm";
  return (
    <div className="space-y-5">
      <GlassCard strong className="p-5">
        <h3 className="font-bold mb-3">Crear código de descuento</h3>
        <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={field} placeholder="CÓDIGO (ej: COLEGIOS25)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-dim w-28">% descuento</span>
            <input type="number" min={1} max={100} className={`${field} flex-1`} value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-dim w-28">Duración</span>
            <select className={`${field} flex-1`} value={duration} onChange={(e) => setDuration(e.target.value as never)}>
              <option value="once">Solo el primer pago</option>
              <option value="repeating">Varios meses</option>
              <option value="forever">Para siempre</option>
            </select>
          </label>
          {duration === "repeating" && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-dim w-28">Meses</span>
              <input type="number" min={1} max={36} className={`${field} flex-1`} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-dim w-28">Usos máximos</span>
            <input type="number" min={1} className={`${field} flex-1`} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-dim w-28">Vence en (días)</span>
            <input type="number" min={1} placeholder="vacío = nunca" className={`${field} flex-1`} value={expiresDays} onChange={(e) => setExpiresDays(e.target.value === "" ? "" : Number(e.target.value))} />
          </label>
          <input className={`${field} sm:col-span-2`} placeholder="Nota interna (opcional, ej: campaña colegios marzo)" value={note} onChange={(e) => setNote(e.target.value)} />
          {msg && (
            <div className={`sm:col-span-2 text-sm rounded-lg p-2.5 ${msg.type === "ok" ? "text-neon-green bg-neon-green/10 border border-neon-green/30" : "text-neon-red bg-neon-red/10 border border-neon-red/30"}`}>
              {msg.text}
            </div>
          )}
          <div className="sm:col-span-2">
            <NeonButton type="submit" loading={loading} size="sm">Crear código</NeonButton>
          </div>
        </form>
      </GlassCard>

      <GlassCard strong className="p-5">
        <h3 className="font-bold mb-3">Códigos existentes</h3>
        {codes.length === 0 ? (
          <p className="text-sm text-ink-dim">Aún no hay códigos.</p>
        ) : (
          <div className="space-y-2">
            {codes.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-2 text-sm border-b border-white/5 pb-2">
                <span className={`font-mono font-bold ${c.active ? "text-neon-cyan" : "text-ink-dim line-through"}`}>{c.code}</span>
                <span>{c.percent}%</span>
                <span className="text-ink-dim">
                  {c.duration === "once" ? "1er pago" : c.duration === "forever" ? "para siempre" : `${c.durationMonths} meses`}
                  {" · "}máx {c.maxRedemptions} uso(s){c.expiresAt ? ` · vence ${fmt(c.expiresAt)}` : ""}
                </span>
                {c.note && <span className="text-ink-dim italic">“{c.note}”</span>}
                {c.active ? (
                  <button onClick={() => deactivate(c.id, c.code)} className="ml-auto text-neon-red text-xs underline hover:no-underline">
                    Desactivar
                  </button>
                ) : (
                  <span className="ml-auto text-xs text-ink-dim">Inactivo</span>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

/* ── Re-trials ────────────────────────────────────────────── */
function RetrialTab({ registry }: { registry: RegistryRow[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function authorize(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/superadmin/retrial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setMsg({ type: "err", text: j.error ?? "Error" });
    setMsg({ type: "ok", text: j.info ?? "Autorizado." });
    setEmail("");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <GlassCard strong className="p-5">
        <h3 className="font-bold mb-1">Autorizar un nuevo trial</h3>
        <p className="text-xs text-ink-dim mb-3">
          La regla es 1 prueba gratis por correo, para siempre. Aquí autorizas la excepción:
          la <b>próxima</b> cuenta creada con ese correo tendrá 7 días de prueba.
        </p>
        <form onSubmit={authorize} className="flex flex-wrap gap-2">
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none text-sm"
            required
          />
          <NeonButton type="submit" loading={loading} size="sm">Autorizar</NeonButton>
        </form>
        {msg && (
          <div className={`mt-3 text-sm rounded-lg p-2.5 ${msg.type === "ok" ? "text-neon-green bg-neon-green/10 border border-neon-green/30" : "text-neon-red bg-neon-red/10 border border-neon-red/30"}`}>
            {msg.text}
          </div>
        )}
      </GlassCard>

      <GlassCard strong className="p-5">
        <h3 className="font-bold mb-3">Historial de trials (últimos 50)</h3>
        <div className="space-y-1.5 text-sm">
          {registry.map((r) => (
            <div key={r.email} className="flex justify-between border-b border-white/5 pb-1.5">
              <span>{r.email}</span>
              <span className="text-ink-dim">
                {fmt(r.firstTrialAt)}{r.retrialAuthorized && <span className="text-neon-green font-bold"> · re-trial OK</span>}
              </span>
            </div>
          ))}
          {registry.length === 0 && <p className="text-ink-dim">Aún no hay trials registrados.</p>}
        </div>
      </GlassCard>
    </div>
  );
}

/* ── Leads de colegios ────────────────────────────────────── */
function LeadsTab({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();

  async function setStatus(id: string, status: string) {
    await fetch("/api/superadmin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  const badge: Record<string, string> = {
    new: "bg-neon-cyan/15 text-neon-cyan",
    contacted: "bg-neon-purple/15 text-neon-purple",
    won: "bg-neon-green/15 text-neon-green",
    lost: "bg-white/10 text-ink-dim",
  };
  const label: Record<string, string> = { new: "Nuevo", contacted: "Contactado", won: "Ganado", lost: "Perdido" };

  return (
    <GlassCard strong className="p-5">
      <h3 className="font-bold mb-3">Solicitudes del formulario /colegios</h3>
      {leads.length === 0 ? (
        <p className="text-sm text-ink-dim">Aún no hay solicitudes.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <div key={l.id} className="border-b border-white/5 pb-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold">{l.institution}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge[l.status] ?? badge.lost}`}>
                  {label[l.status] ?? l.status}
                </span>
                <span className="text-ink-dim ml-auto">{fmt(l.createdAt)}</span>
              </div>
              <div className="text-xs text-ink-dim mt-1">
                {l.contact} · {l.email}{l.phone ? ` · ${l.phone}` : ""}{l.students ? ` · ${l.students} alumnos` : ""}
              </div>
              <div className="flex gap-2 mt-2">
                {(["contacted", "won", "lost"] as const).filter((s) => s !== l.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(l.id, s)}
                    className="text-xs px-2.5 py-1 rounded-full bg-surface-mid border border-white/10 hover:border-neon-cyan/50 transition-colors"
                  >
                    Marcar {label[s].toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
