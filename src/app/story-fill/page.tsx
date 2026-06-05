import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryFillRunner } from "@/components/story-fill/StoryFillRunner";

export default async function SFPage({ searchParams }: { searchParams: { kid?: string; world?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const kidId = searchParams.kid;
  const worldKey = searchParams.world ?? "vocab";
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles").select("id, name, color_hex").eq("id", kidId).single();
  if (!kid) redirect("/profiles");

  return <StoryFillRunner kid={kid} worldKey={worldKey} />;
}
