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
    .select("id, name, emoji, avatar_url, color_hex, total_xp, cefr_level, family_id, course_id")
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

  // Mundo colegio: compañeros del MISMO curso a los que puede retar directo
  // (misma lectura que la liga del curso, permitida por RLS a los del curso).
  let classmates: Array<{ id: string; name: string; emoji: string }> | undefined;
  if (worldKey === "school_world" && kid.course_id && canChallenge) {
    const { data: mates } = await supabase
      .from("kid_profiles")
      .select("id, name, emoji")
      .eq("course_id", kid.course_id)
      .neq("id", kid.id)
      .is("archived_at", null)
      .order("name", { ascending: true })
      .limit(12);
    classmates = (mates ?? []).map((m) => ({ id: m.id, name: m.name, emoji: m.emoji }));
  }

  return <BattleRunner kid={kid} worldKey={worldKey} words={words} canChallenge={canChallenge} classmates={classmates} />;
}
