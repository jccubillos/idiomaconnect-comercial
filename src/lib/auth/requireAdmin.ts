import { createClient } from "@/lib/supabase/server";

/**
 * Verifica que el usuario actual sea ADMIN de un colegio.
 * Devuelve { userId, orgId } o un objeto de error con el status HTTP.
 */
export async function requireAdmin(): Promise<
  | { ok: true; userId: string; orgId: string }
  | { ok: false; status: number; error: string }
> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "No autorizado" };

  const { data: membership } = await supabase
    .from("staff_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (!membership) return { ok: false, status: 403, error: "Solo el administrador del colegio puede hacer esto" };
  return { ok: true, userId: user.id, orgId: membership.org_id };
}
