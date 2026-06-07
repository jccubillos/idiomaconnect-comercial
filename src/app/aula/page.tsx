import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import { getCefrInfo } from "@/lib/content/cefr";
import { resolveRole } from "@/lib/auth/role";

export const dynamic = "force-dynamic";

/**
 * "Aula" — pantalla de práctica para colegios. El profesor o admin abre esta
 * pantalla en un dispositivo compartido y el alumno elige su perfil para
 * practicar (igual que la pantalla familiar "¿quién va a aprender?").
 *
 * RLS decide qué alumnos ve cada quien: el admin ve todo el colegio; el
 * profesor, solo los alumnos de sus cursos.
 */
export default async function AulaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { role, orgId } = await resolveRole(supabase, user.id);
  if (role === "family") redirect("/profiles");

  const backHref = role === "school_admin" ? "/school-admin" : "/teacher";

  const { data: org } = orgId
    ? await supabase.from("families").select("family_name").eq("id", orgId).single()
    : { data: null };

  // RLS limita los alumnos según el rol (admin: todo el colegio; profe: sus cursos).
  const { data: students = [] } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, total_xp, course_id")
    .is("archived_at", null)
    .order("name", { ascending: true });

  // Nombres de cursos para agrupar.
  const courseIds = Array.from(new Set((students ?? []).map((s) => s.course_id).filter(Boolean))) as string[];
  const { data: courses = [] } = courseIds.length
    ? await supabase.from("courses").select("id, name").in("id", courseIds)
    : { data: [] };
  const courseName = new Map((courses ?? []).map((c) => [c.id, c.name]));

  // Agrupar por curso.
  type Stu = NonNullable<typeof students>[number];
  const groups = new Map<string, Stu[]>();
  for (const s of students ?? []) {
    const key = s.course_id ? (courseName.get(s.course_id) ?? "Curso") : "Sin curso";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <main className="pt-10 pb-24 px-5 max-w-5xl mx-auto relative z-10">
      <Link href={backHref} className="text-sm font-bold text-neon-cyan">← Volver al panel</Link>
      <header className="text-center my-6">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-1">Modo aula</h1>
        <p className="text-sm text-ink-dim">{org?.family_name ?? "Colegio"} · el alumno elige su perfil para practicar</p>
      </header>

      {(!students || students.length === 0) ? (
        <GlassCard className="p-8 text-center">
          <div className="text-4xl mb-3">🧑‍🎓</div>
          <p className="text-sm text-ink-dim">Aún no hay alumnos disponibles.</p>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([courseLabel, list]) => (
            <div key={courseLabel}>
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink-dim mb-3">{courseLabel}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {list.map((kid) => {
                  const cefr = getCefrInfo(kid.total_xp);
                  return (
                    <Link key={kid.id} href={`/worlds?kid=${kid.id}`}>
                      <GlassCard className="p-4 text-center h-full hover:scale-[1.03] transition-transform">
                        <div className="mb-3 mx-auto" style={{ width: "fit-content" }}>
                          <Avatar src={kid.avatar_url} emoji={kid.emoji ?? "👤"} name={kid.name} ringColor={kid.color_hex} size="md" />
                        </div>
                        <h3 className="font-bold text-sm mb-0.5">{kid.name}</h3>
                        <div className="text-xs" style={{ color: kid.color_hex }}>{cefr.code} · {kid.total_xp} XP</div>
                      </GlassCard>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <Link href={backHref}><NeonButton variant="ghost-cyan" size="sm">Salir del modo aula</NeonButton></Link>
      </div>
    </main>
  );
}
