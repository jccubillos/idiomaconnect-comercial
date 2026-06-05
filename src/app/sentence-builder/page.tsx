import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SentenceBuilderRunner } from "@/components/sentence-builder/SentenceBuilderRunner";

export default async function SBPage({ searchParams }: { searchParams: { kid?: string; world?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const kidId = searchParams.kid;
  const worldKey = searchParams.world ?? "grammar";
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles").select("id, name, color_hex").eq("id", kidId).single();
  if (!kid) redirect("/profiles");

  return <SentenceBuilderRunner kid={kid} worldKey={worldKey} />;
}
