import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamRunner } from "@/components/exam/ExamRunner";

export default async function ExamPage({
  searchParams,
}: {
  searchParams: { kid?: string; onboarding?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!searchParams.kid) redirect("/profiles");
  const { data: kid } = await supabase
    .from("kid_profiles").select("id, name, color_hex, cefr_level").eq("id", searchParams.kid).single();
  if (!kid) redirect("/profiles");
  return <ExamRunner kid={kid} onboarding={searchParams.onboarding === "1"} />;
}
