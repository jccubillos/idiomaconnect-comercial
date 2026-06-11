import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonRunner } from "@/components/lesson/LessonRunner";

interface PageProps {
  searchParams: { kid?: string; world?: string; topic?: string; unit?: string; eval?: string };
}

export default async function LessonPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  const worldKey = searchParams.world ?? "london_hub";
  if (!kidId) redirect("/profiles");

  // "Tema del Colegio": necesita un tema escrito/hablado por el alumno.
  // Si llega sin tema, lo devolvemos a la pantalla de entrada.
  const schoolTopic = searchParams.topic?.trim() || undefined;
  if (worldKey === "school" && !schoolTopic) redirect(`/school?kid=${kidId}`);

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, color_hex, total_xp, cefr_level")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  return (
    <LessonRunner
      kid={kid}
      worldKey={worldKey}
      schoolTopic={schoolTopic}
      unitId={searchParams.unit?.trim() || undefined}
      evalId={searchParams.eval?.trim() || undefined}
    />
  );
}
