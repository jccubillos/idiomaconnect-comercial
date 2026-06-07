import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VisualFlashcardsRunner } from "@/components/flashcards/VisualFlashcardsRunner";
import { buildVisualSession } from "@/lib/content/visual-flashcards";

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: { kid?: string; world?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  const worldKey = searchParams.world ?? "vocab";
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, color_hex")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  // Construye sesión de 12 tarjetas visuales (sin IA, instantáneo)
  const cards = buildVisualSession(12);

  return <VisualFlashcardsRunner cards={cards} kid={kid} worldKey={worldKey} />;
}
