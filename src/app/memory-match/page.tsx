import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemoryRunner } from "@/components/memory-match/MemoryRunner";

export default async function MMPage({ searchParams }: { searchParams: { kid?: string; world?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!searchParams.kid) redirect("/profiles");
  const { data: kid } = await supabase
    .from("kid_profiles").select("id, name, color_hex").eq("id", searchParams.kid).single();
  if (!kid) redirect("/profiles");
  return <MemoryRunner kid={kid} worldKey={searchParams.world} />;
}
