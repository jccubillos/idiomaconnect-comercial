import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: family } = await supabase
    .from("families")
    .select("family_name, plan, trial_ends_at, payment_customer_id, parental_consent_at, privacy_accepted_at")
    .eq("owner_user_id", user.id)
    .single();

  return (
    <main className="min-h-dvh px-5 py-12 max-w-2xl mx-auto relative z-10">
      <Link href="/profiles">
        <NeonButton variant="ghost-cyan" size="sm" className="mb-6">← Volver</NeonButton>
      </Link>

      <h1 className="text-3xl font-extrabold mb-1">Settings</h1>
      <p className="text-sm text-ink-dim mb-8">Configuración de la cuenta familiar.</p>

      <GlassCard strong className="p-6 mb-4">
        <h2 className="font-bold mb-3">Cuenta</h2>
        <Row label="Email" value={user.email ?? "—"} />
        <Row label="Familia" value={family?.family_name ?? "—"} />
        <Row label="Plan" value={family?.plan ?? "—"} />
        {family?.plan === "trial" && family.trial_ends_at && (
          <Row label="Trial termina" value={new Date(family.trial_ends_at).toLocaleDateString()} />
        )}
      </GlassCard>

      <GlassCard strong className="p-6 mb-4">
        <h2 className="font-bold mb-3">Suscripción</h2>
        {family?.payment_customer_id ? (
          <Link href="/billing">
            <NeonButton variant="ghost-cyan">Administrar suscripción</NeonButton>
          </Link>
        ) : (
          <Link href="/billing">
            <NeonButton variant="primary">Suscribirme</NeonButton>
          </Link>
        )}
      </GlassCard>

      <GlassCard strong className="p-6 mb-4">
        <h2 className="font-bold mb-3">Privacidad y consentimiento</h2>
        <Row label="Consentimiento parental" value={family?.parental_consent_at ? "✔ otorgado" : "Pendiente"} />
        <Row label="Política aceptada" value={family?.privacy_accepted_at ? "✔" : "—"} />
        <div className="mt-3 flex gap-2 text-sm">
          <Link href="/privacy" className="text-neon-cyan underline">Política de privacidad</Link>
          <Link href="/terms" className="text-neon-cyan underline">Términos</Link>
        </div>
      </GlassCard>

      <GlassCard strong className="p-6 border border-neon-red/40">
        <h2 className="font-bold mb-3 text-neon-red">Zona peligrosa</h2>
        <p className="text-sm text-ink-dim mb-4">
          Borrar tu cuenta elimina permanentemente todos los perfiles, sesiones, palabras SRS
          y trofeos de tu familia. No se puede deshacer.
        </p>
        <DeleteAccountButton />
      </GlassCard>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
      <span className="text-ink-dim">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
