import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import { cefrTier } from "@/lib/content/cefr";
import { familyAccess } from "@/lib/billing/access";
import { TrialBanner } from "@/components/billing/TrialBanner";
import { BottomNav } from "@/components/ui/BottomNav";
import { CulturalCapsule } from "@/components/cultural/CulturalCapsule";
import { resolveRole, homePathForRole } from "@/lib/auth/role";

export default async function ProfilesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Si es staff de colegio (admin/profesor), va a su panel, no al flujo familiar.
  const { role } = await resolveRole(supabase, user.id);
  if (role !== "family") redirect(homePathForRole(role));

  const { data: family } = await supabase
    .from("families")
    .select("id, family_name, plan, trial_ends_at")
    .eq("owner_user_id", user.id)
    .single();

  if (!family) redirect("/onboarding");

  // Filtro EXPLÍCITO por familia (defensa en profundidad sobre RLS): garantiza
  // que cada cuenta solo vea SUS propios perfiles, sin depender solo de RLS.
  const { data: kids = [] } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, total_xp, cefr_level, hobbies")
    .eq("family_id", family.id)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  // If no kids yet, push to onboarding
  if (!kids?.length) redirect("/onboarding");

  const access = familyAccess(family);

  return (
    <>
      <main className="pt-12 pb-32 px-5 max-w-5xl mx-auto relative z-10">
        {/* Engranaje de configuración (arriba a la derecha) */}
        <div className="absolute top-4 right-5 z-20">
          <Link
            href="/account/settings"
            aria-label="Configuración"
            title="Configuración"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-mid border border-white/10 text-ink-dim hover:text-neon-cyan hover:border-neon-cyan/50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>

        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-2">
            ¿Quién está listo para
            <br />
            <span className="text-glow-cyan text-neon-cyan">aprender inglés</span>
            {" "}hoy?
          </h1>
          <div className="w-24 h-1 mx-auto mt-4 rounded-full bg-gradient-to-r from-neon-red to-neon-cyan" />
        </div>

        {(access.isTrial || access.expired) && (
          <TrialBanner daysLeft={access.daysLeft} expired={access.expired} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {(kids ?? []).map((kid) => {
            const tier = cefrTier(kid.cefr_level);
            return (
              <GlassCard key={kid.id} className="p-5 text-center">
                <div className="mb-4 mx-auto" style={{ width: "fit-content" }}>
                  <Avatar
                    src={kid.avatar_url}
                    emoji={kid.emoji ?? "👤"}
                    name={kid.name}
                    ringColor={kid.color_hex}
                    size="lg"
                  />
                </div>
                <h3 className="text-xl font-bold mb-1">{kid.name}</h3>
                <div
                  className="font-bold text-sm mb-1"
                  style={{ color: kid.color_hex, textShadow: `0 0 12px ${kid.color_hex}88` }}
                >
                  {kid.total_xp} XP · {kid.cefr_level} {tier.name}
                </div>
                {kid.hobbies && (
                  <p className="text-xs text-ink-dim mb-4 line-clamp-1">{kid.hobbies}</p>
                )}
                <Link href={`/worlds?kid=${kid.id}`}>
                  <NeonButton variant="primary" className="w-full">
                    ¡Soy {kid.name}!
                  </NeonButton>
                </Link>
              </GlassCard>
            );
          })}

          {/* Add another kid (up to plan limit) */}
          {kids && kids.length < 6 && (
            <Link href="/onboarding/kid">
              <GlassCard className="p-5 text-center h-full border-dashed border-white/20 hover:border-neon-cyan/50 transition-colors flex flex-col items-center justify-center min-h-[280px]">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-neon-cyan/40 flex items-center justify-center text-3xl text-neon-cyan mb-3">
                  +
                </div>
                <h3 className="font-bold mb-1">Agregar niño/a</h3>
                <p className="text-xs text-ink-dim">Hasta 6 perfiles por familia</p>
              </GlassCard>
            </Link>
          )}
        </div>

        <div className="max-w-md mx-auto mb-6">
          <CulturalCapsule />
        </div>

        <div className="text-center">
          <Link href="/parent">
            <NeonButton variant="ghost-cyan" size="sm">👨‍👩‍👧 Dashboard de padres</NeonButton>
          </Link>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
