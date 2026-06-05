import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SrsRunner } from "@/components/srs/SrsRunner";

export default async function SrsPage({ searchParams }: { searchParams: { kid?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const kidId = searchParams.kid;
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, color_hex")
    .eq("id", kidId).single();
  if (!kid) redirect("/profiles");

  return <SrsRunner kid={kid} />;
}
