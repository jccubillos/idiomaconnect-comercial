import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAppAdmin, verifyAdminSession, ADMIN_COOKIE } from "@/lib/superadmin/auth";
import { TotpGate } from "@/components/superadmin/TotpGate";
import { AdminPanel, type AccountRow, type CodeRow, type RegistryRow, type LeadRow } from "@/components/superadmin/AdminPanel";
import { GlassCard } from "@/components/ui/GlassCard";

export const dynamic = "force-dynamic";

/**
 * DASHBOARD DE ADMINISTRACIÓN DE LA PLATAFORMA — acceso discreto por URL directa.
 *
 * Guard de 3 capas:
 *  1. Sesión Supabase (login normal).
 *  2. Membresía en app_admins — si no, 404 (la página "no existe").
 *  3. TOTP (Google Authenticator) → cookie firmada de 12 h.
 */
export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const svc = createServiceClient();
  const admin = await getAppAdmin(svc, user.id);
  if (!admin) notFound();

  if (!admin.totp_verified) return <TotpGate mode="setup" />;

  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(cookie, user.id)) return <TotpGate mode="challenge" />;

  /* ── Datos (service role; ya pasamos el guard) ─────────────── */
  const [
    { data: families = [] },
    { data: codes = [] },
    { data: registry = [] },
    { data: leads = [] },
    { data: entitlements },
    { data: rewards },
  ] = await Promise.all([
    svc.from("families")
      .select("id, owner_user_id, family_name, plan, org_type, trial_ends_at, payment_failed_at, discount_code, referred_by, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    svc.from("discount_codes").select("*").order("created_at", { ascending: false }).limit(100),
    svc.from("trial_registry").select("email, first_trial_at, retrial_authorized")
      .order("first_trial_at", { ascending: false }).limit(50),
    svc.from("school_leads").select("id, institution_name, contact_name, email, phone, num_students, status, created_at")
      .order("created_at", { ascending: false }).limit(50),
    // Canal de afiliados (degradan a [] si la migración 0016/0017 no está aplicada).
    svc.from("hotmart_entitlements").select("plan, status").eq("status", "applied").limit(2000),
    svc.from("referral_rewards").select("method").limit(2000),
  ]);

  // Correos de los dueños de cada cuenta.
  const emailById = new Map<string, string>();
  try {
    const { data: usersPage } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of usersPage?.users ?? []) emailById.set(u.id, u.email ?? "—");
  } catch { /* sin listUsers seguimos sin correos */ }

  const now = Date.now();
  const fams = families ?? [];
  const stats = {
    monthly: fams.filter((f) => f.plan === "family_monthly").length,
    yearly: fams.filter((f) => f.plan === "family_yearly").length,
    // Colegios: SOLO contratos reales (plan 'school'). Los pilotos van aparte.
    schools: fams.filter((f) => f.org_type === "school" && f.plan === "school").length,
    schoolPilots: fams.filter(
      (f) => f.org_type === "school" && f.plan === "trial" && new Date(f.trial_ends_at).getTime() > now,
    ).length,
    trialsActive: fams.filter(
      (f) => f.org_type === "family" && f.plan === "trial" && new Date(f.trial_ends_at).getTime() > now,
    ).length,
    trialsTotal: (registry ?? []).length,
    expired: fams.filter((f) => f.org_type === "family" && (f.plan === "expired" || (f.plan === "trial" && new Date(f.trial_ends_at).getTime() <= now))).length,
    paymentIssues: fams.filter((f) => f.payment_failed_at).length,
  };

  // ── Canal de afiliados / referidos ──────────────────────────
  const ents = entitlements ?? [];
  const channel = {
    // Ventas de afiliado (Hotmart) ya aplicadas, por producto.
    hotmartStarter: ents.filter((e) => e.plan === "family_yearly").length,
    hotmartPro: ents.filter((e) => e.plan === "family_plus").length,
    hotmartLifetime: ents.filter((e) => e.plan === "family_lifetime").length,
    hotmartTotal: ents.length,
    // Referidos: familias que llegaron con un código + meses regalados.
    referredSignups: fams.filter((f) => f.referred_by).length,
    rewardsGranted: (rewards ?? []).length,
  };

  // % de cada código (para mostrar el descuento aplicado en la tabla de cuentas).
  const percentByCode = new Map((codes ?? []).map((c) => [c.code, c.percent]));

  const accounts: AccountRow[] = fams.map((f) => ({
    id: f.id,
    name: f.family_name,
    email: emailById.get(f.owner_user_id) ?? "—",
    plan: f.plan,
    orgType: f.org_type,
    trialEndsAt: f.trial_ends_at,
    paymentFailedAt: f.payment_failed_at,
    discountCode: f.discount_code,
    discountPercent: f.discount_code ? (percentByCode.get(f.discount_code) ?? null) : null,
    createdAt: f.created_at,
  }));

  const codeRows: CodeRow[] = (codes ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    percent: c.percent,
    duration: c.duration,
    durationMonths: c.duration_months,
    maxRedemptions: c.max_redemptions,
    expiresAt: c.expires_at,
    active: c.active,
    note: c.note,
  }));

  const registryRows: RegistryRow[] = (registry ?? []).map((r) => ({
    email: r.email,
    firstTrialAt: r.first_trial_at,
    retrialAuthorized: r.retrial_authorized,
  }));

  const leadRows: LeadRow[] = (leads ?? []).map((l) => ({
    id: l.id,
    institution: l.institution_name,
    contact: l.contact_name,
    email: l.email,
    phone: l.phone,
    students: l.num_students,
    status: l.status,
    createdAt: l.created_at,
  }));

  return (
    <main className="pt-10 pb-24 px-5 max-w-6xl mx-auto relative z-10">
      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-neon-purple mb-1">🔐 Administración</div>
        <h1 className="text-3xl font-extrabold">IdiomaConnect — Panel del dueño</h1>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Fam. mensual" value={stats.monthly} color="text-neon-cyan" />
        <Stat label="Fam. anual" value={stats.yearly} color="text-neon-cyan" />
        <Stat label="Colegios (contrato)" value={stats.schools} color="text-neon-purple" />
        <Stat label="Pilotos colegio" value={stats.schoolPilots} color="text-neon-purple" />
        <Stat label="Trials activos" value={stats.trialsActive} color="text-neon-green" />
        <Stat label="Trials históricos" value={stats.trialsTotal} color="text-neon-green" />
        <Stat label="Expiradas" value={stats.expired} color="text-ink-dim" />
        <Stat label="Pagos con falla" value={stats.paymentIssues} color="text-neon-red" />
      </div>

      {/* Canal de afiliados / referidos */}
      <div className="text-xs font-bold uppercase tracking-widest text-neon-green mb-2">📣 Canal de afiliados</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Ventas Hotmart" value={channel.hotmartTotal} color="text-neon-green" />
        <Stat label="↳ Starter $47" value={channel.hotmartStarter} color="text-ink-dim" />
        <Stat label="↳ Pro Family $127" value={channel.hotmartPro} color="text-ink-dim" />
        <Stat label="↳ Lifetime $349" value={channel.hotmartLifetime} color="text-ink-dim" />
        <Stat label="Referidos llegados" value={channel.referredSignups} color="text-neon-cyan" />
        <Stat label="Meses regalados" value={channel.rewardsGranted} color="text-neon-cyan" />
      </div>

      <AdminPanel accounts={accounts} codes={codeRows} registry={registryRows} leads={leadRows} />
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlassCard className="p-3 text-center">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink-dim mt-0.5">{label}</div>
    </GlassCard>
  );
}
