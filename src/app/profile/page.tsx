import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /profile — when called without [kidId], redirect to the most recently active kid.
 */
export default async function ProfileIndex() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: kids = [] } = await supabase
    .from("kid_profiles")
    .select("id")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (!kids?.length) redirect("/profiles");
  redirect(`/profile/${kids[0].id}`);
}
