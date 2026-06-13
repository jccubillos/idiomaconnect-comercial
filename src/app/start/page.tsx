import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveRole, homePathForRole } from "@/lib/auth/role";
import { claimHotmartEntitlements } from "@/lib/payments/hotmart";

export const dynamic = "force-dynamic";

/**
 * Dispatcher post-login: envía a cada usuario a su panel según su rol
 * (familia → /profiles, profesor → /teacher, admin colegio → /school-admin).
 * Antes, reclama cualquier compra de Hotmart pendiente para su correo.
 */
export default async function StartPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reclamar compras de afiliado (Hotmart) hechas antes de tener cuenta.
  if (user.email) {
    try {
      await claimHotmartEntitlements(createServiceClient(), user.id, user.email);
    } catch { /* sin service key o migración pendiente */ }
  }

  const { role } = await resolveRole(supabase, user.id);
  redirect(homePathForRole(role));
}
