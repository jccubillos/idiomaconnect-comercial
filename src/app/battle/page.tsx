import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BattleRunner } from "@/components/battle/BattleRunner";
import { getCefrInfo } from "@/lib/content/cefr";
import { buildBattleSession } from "@/lib/content/vocabulary";
import { hasPlusAccess } from "@/lib/billing/access";

interface PageProps {
  searchParams: { kid?: string; world?: string };
}

export default async function BattlePage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  const worldKey = searchParams.world ?? "vocab";
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, total_xp, cefr_level, family_id")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  // ⚔️ Retar a un amigo: exclusivo Plus/Vitalicio (y trial vigente, como gancho).
  const { data: fam } = await supabase
    .from("families")
    .select("plan, trial_ends_at")
    .eq("id", kid.family_id)
    .single();
  const canChallenge = fam ? hasPlusAccess(fam) : false;

  // Sesión curada según el nivel CEFR del niño (vocabulario planificado, sin IA).
  const cefr = getCefrInfo(kid.total_xp);
  const words = buildBattleSession(cefr.code, 12);

  return <BattleRunner kid={kid} worldKey={worldKey} words={words} canChallenge={canChallenge} />;
}
