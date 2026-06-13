import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /profile — when called without [kidId], redirect to the most recently active kid.
 */
export default async function ProfileIndex() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Filtro EXPLÍCITO por familia (defensa en profundidad sobre RLS): garantiza
  // que solo redirija a un perfil PROPIO, nunca al de otra familia.
  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();
  if (!family) redirect("/profiles");

  const { data: kids = [] } = await supabase
    .from("kid_profiles")
    .select("id")
    .eq("family_id", family.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (!kids?.length) redirect("/profiles");
  redirect(`/profile/${kids[0].id}`);
}
