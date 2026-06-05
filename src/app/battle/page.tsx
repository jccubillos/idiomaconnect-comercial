import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BattleRunner } from "@/components/battle/BattleRunner";

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
    .select("id, name, emoji, avatar_url, color_hex, total_xp, cefr_level")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  return <BattleRunner kid={kid} worldKey={worldKey} />;
}
