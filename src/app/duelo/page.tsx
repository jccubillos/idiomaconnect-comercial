import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { resolveRole } from "@/lib/auth/role";
import { hasPlusAccess } from "@/lib/billing/access";
import { DueloRunner, type DueloKid } from "@/components/duelo/DueloRunner";

export const dynamic = "force-dynamic";

/**
 * 🥊 DUELO FAMILIAR — herramienta Plus. 2 jugadores en el mismo dispositivo.
 * Exclusivo de familias (no aplica al flujo de colegio).
 */
export default async function DueloPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/duelo");

  // Solo familias.
  const { role } = await resolveRole(supabase, user.id);
  if (role !== "family") redirect("/start");

  const { data: family } = await supabase
    .from("families")
    .select("id, plan, trial_ends_at")
    .eq("owner_user_id", user.id)
    .single();
  if (!family) redirect("/onboarding");

  // Candado Plus (incluye trial vigente como gancho).
  if (!hasPlusAccess(family)) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <GlassCard strong className="p-8 max-w-md text-center border border-neon-purple/40">
          <div className="text-5xl mb-3">🥊🔒</div>
          <h1 className="text-2xl font-extrabold mb-1">Duelo Familiar</h1>
          <p className="text-sm text-ink-dim mb-5">
            Pon a prueba a toda la familia: padres vs hijos, hermano vs hermana, en un solo
            teléfono. Quién sabe más inglés se corona. Exclusivo del plan <b>Plus</b> y <b>Vitalicio</b>.
          </p>
          <Link href="/billing">
            <NeonButton variant="primary" size="lg" className="w-full">Desbloquear con Plus</NeonButton>
          </Link>
          <Link href="/arena" className="block mt-3 text-xs text-ink-dim hover:text-neon-cyan">← Volver a Arena</Link>
        </GlassCard>
      </main>
    );
  }

  const { data: kids = [] } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, total_xp")
    .eq("family_id", family.id)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (!kids || kids.length === 0) redirect("/onboarding");

  return <DueloRunner kids={kids as DueloKid[]} />;
}
