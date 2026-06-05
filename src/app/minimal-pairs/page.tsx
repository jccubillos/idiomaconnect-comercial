import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MinimalPairsRunner } from "@/components/minimal-pairs/MinimalPairsRunner";

export default async function MPPage({ searchParams }: { searchParams: { kid?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!searchParams.kid) redirect("/profiles");
  const { data: kid } = await supabase
    .from("kid_profiles").select("id, name, color_hex").eq("id", searchParams.kid).single();
  if (!kid) redirect("/profiles");
  return <MinimalPairsRunner kid={kid} />;
}
