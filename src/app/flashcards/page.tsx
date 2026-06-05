import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FlashcardsRunner } from "@/components/flashcards/FlashcardsRunner";

export default async function FlashcardsPage({ searchParams }: { searchParams: { kid?: string; world?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const kidId = searchParams.kid;
  const worldKey = searchParams.world ?? "vocab";
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, color_hex")
    .eq("id", kidId).single();
  if (!kid) redirect("/profiles");

  return <FlashcardsRunner kid={kid} worldKey={worldKey} />;
}
