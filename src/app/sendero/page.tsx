import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { effectiveCefrInfo } from "@/lib/content/cefr";
import { buildSendero, senderoSummary } from "@/lib/content/sendero";
import { SenderoMap } from "@/components/sendero/SenderoMap";

interface PageProps {
  searchParams: { kid?: string };
}

export default async function SenderoPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, total_xp, cefr_level")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  // Progreso del sendero = lecciones de gramática (currículo) completadas.
  const { count: grammarCount } = await supabase
    .from("lesson_sessions")
    .select("id", { count: "exact", head: true })
    .eq("kid_id", kid.id)
    .eq("world_key", "grammar");

  // Nivel EFECTIVO con doble exigencia (XP + unidades completadas), con piso en el
  // nivel ya alcanzado (no baja a quien fue ubicado por diagnóstico).
  const cefr = effectiveCefrInfo(kid.total_xp, grammarCount ?? 0, kid.cefr_level);

  const stations = buildSendero(cefr.code, grammarCount ?? 0);
  const summary = senderoSummary(stations);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">
          ← Worlds
        </Link>
        <div className="flex items-center gap-2">
          <Avatar src={kid.avatar_url} emoji={kid.emoji} name={kid.name} ringColor={kid.color_hex} size="sm" />
          <span className="text-sm font-bold">{kid.name}</span>
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-md mx-auto relative z-10">
        {/* Encabezado del sendero */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌌</div>
          <h1 className="text-3xl font-extrabold mb-1">Tu Sendero</h1>
          <p className="text-sm text-ink-dim mb-4">
            El camino ordenado del inglés, de A1 a C2.
          </p>
          <div className="inline-flex flex-col items-center gap-2 w-full max-w-xs mx-auto">
            <div className="flex justify-between w-full text-xs font-bold">
              <span className="text-ink-dim">{summary.completed} / {summary.total} unidades</span>
              <span className="text-neon-cyan">{summary.pct}%</span>
            </div>
            <div className="progress-track w-full">
              <div
                className="progress-fill"
                style={{ width: `${summary.pct}%`, background: "linear-gradient(90deg, #00eefc, #c464ff)" }}
              />
            </div>
            {summary.current && (
              <div className="text-xs text-ink-dim mt-1">
                Estás en la <span className="font-bold text-neon-cyan">unidad {summary.current.number}</span>: {summary.current.unit.title}
              </div>
            )}
          </div>
        </div>

        <SenderoMap stations={stations} kidId={kid.id} />
      </main>
      <BottomNav />
    </>
  );
}
