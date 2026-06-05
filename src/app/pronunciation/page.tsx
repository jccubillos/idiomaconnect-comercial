import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PronunciationRunner } from "@/components/pronunciation/PronunciationRunner";

interface PageProps {
  searchParams: { kid?: string; world?: string };
}

export default async function PronunciationPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  const worldKey = searchParams.world ?? "sound";
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  return <PronunciationRunner kid={kid} worldKey={worldKey} />;
}
