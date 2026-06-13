import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { BattleRunner } from "@/components/battle/BattleRunner";
import type { BattleWord } from "@/lib/content/vocabulary";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
  searchParams: { kid?: string };
}

/**
 * JUGAR un reto: la misma Battle, con las MISMAS palabras del retador.
 * Al terminar, el runner compara los puntajes y muestra el veredicto.
 */
export default async function JugarRetoPage({ params, searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/reto/${params.id}`);

  const kidId = searchParams.kid;
  if (!kidId) redirect(`/reto/${params.id}`);

  // RLS: solo perfiles de la propia familia (o curso del staff).
  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, total_xp, cefr_level")
    .eq("id", kidId)
    .single();
  if (!kid) redirect(`/reto/${params.id}`);

  const svc = createServiceClient();
  const { data: reto } = await svc
    .from("battle_challenges")
    .select("id, creator_name, score_pct, words, plays, expires_at")
    .eq("id", params.id)
    .single();
  if (!reto || new Date(reto.expires_at).getTime() < Date.now()) {
    redirect(`/reto/${params.id}`);
  }

  // Contador de jugadas (métrica del reto), mejor esfuerzo.
  await svc.from("battle_challenges").update({ plays: reto.plays + 1 }).eq("id", reto.id);

  const words = reto.words as BattleWord[];

  return (
    <BattleRunner
      kid={kid}
      worldKey="reto"
      words={words}
      challenge={{ id: reto.id, name: reto.creator_name, score: reto.score_pct }}
    />
  );
}
