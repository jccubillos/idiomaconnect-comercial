import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveRole, homePathForRole } from "@/lib/auth/role";

/**
 * Dispatcher post-login: envía a cada usuario a su panel según su rol
 * (familia → /profiles, profesor → /teacher, admin colegio → /school-admin).
 */
export default async function StartPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { role } = await resolveRole(supabase, user.id);
  redirect(homePathForRole(role));
}
