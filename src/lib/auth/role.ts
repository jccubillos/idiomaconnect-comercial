/**
 * Detección de rol del usuario autenticado.
 *
 * Un mismo login puede ser:
 *   - "family"        → cuenta familiar normal (flujo de padres).
 *   - "school_admin"  → administra un colegio (org_type='school').
 *   - "teacher"       → profesor de uno o más cursos de un colegio.
 *
 * Se determina consultando `staff_members`. Si no hay membresía → familia.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type AppRole = "family" | "school_admin" | "teacher";

export interface RoleInfo {
  role: AppRole;
  /** Colegio (families.id con org_type='school') si es staff. */
  orgId: string | null;
}

/**
 * Resuelve el rol del usuario. `userId` = auth.uid().
 * Prioriza admin > teacher > family.
 */
export async function resolveRole(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<RoleInfo> {
  const { data: memberships } = await supabase
    .from("staff_members")
    .select("org_id, role")
    .eq("user_id", userId);

  if (memberships && memberships.length > 0) {
    const admin = memberships.find((m) => m.role === "admin");
    if (admin) return { role: "school_admin", orgId: admin.org_id };
    const teacher = memberships.find((m) => m.role === "teacher");
    if (teacher) return { role: "teacher", orgId: teacher.org_id };
  }

  return { role: "family", orgId: null };
}

/** Ruta de inicio según el rol. */
export function homePathForRole(role: AppRole): string {
  switch (role) {
    case "school_admin":
      return "/school-admin";
    case "teacher":
      return "/teacher";
    default:
      return "/profiles";
  }
}
