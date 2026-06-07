import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import { getCefrInfo } from "@/lib/content/cefr";
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

  const { data: kids = [] } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, total_xp, cefr_level, hobbies")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  // If no kids yet, push to onboarding
  if (!kids?.length) redirect("/onboarding");

  const trialActive = family?.plan === "trial" && family.trial_ends_at && new Date(family.trial_ends_at) > new Date();
  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((new Date(family!.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : 0;

  return (
    <>
      <main className="pt-12 pb-32 px-5 max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-2">
            ¿Quién está listo para
            <br />
            <span className="text-glow-cyan text-neon-cyan">aprender inglés</span>
            {" "}hoy?
          </h1>
          <div className="w-24 h-1 mx-auto mt-4 rounded-full bg-gradient-to-r from-neon-red to-neon-cyan" />
        </div>

        {trialActive && (
          <div className="max-w-md mx-auto mb-6 text-center text-xs font-bold uppercase tracking-wide">
            <span className="px-3 py-1 rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40">
              Free trial · {trialDaysLeft} día{trialDaysLeft === 1 ? "" : "s"} restantes
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {(kids ?? []).map((kid) => {
            const cefr = getCefrInfo(kid.total_xp);
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
                  {kid.total_xp} XP · {cefr.code} {cefr.name}
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
