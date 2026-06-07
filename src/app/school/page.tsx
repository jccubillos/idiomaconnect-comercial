import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SchoolTopicPanel } from "@/components/school/SchoolTopicPanel";

interface PageProps {
  searchParams: { kid?: string };
}

export default async function SchoolPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, color_hex")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  return <SchoolTopicPanel kid={kid} />;
}
