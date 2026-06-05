import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonRunner } from "@/components/lesson/LessonRunner";

interface PageProps {
  searchParams: { kid?: string; world?: string };
}

export default async function LessonPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  const worldKey = searchParams.world ?? "london_hub";
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, color_hex, total_xp, cefr_level")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  return <LessonRunner kid={kid} worldKey={worldKey} />;
}
