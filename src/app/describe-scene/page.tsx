import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DescribeSceneRunner } from "@/components/describe-scene/DescribeSceneRunner";

export default async function DSPage({ searchParams }: { searchParams: { kid?: string; world?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!searchParams.kid) redirect("/profiles");
  const { data: kid } = await supabase
    .from("kid_profiles").select("id, name, color_hex").eq("id", searchParams.kid).single();
  if (!kid) redirect("/profiles");
  return <DescribeSceneRunner kid={kid} worldKey={searchParams.world} />;
}
