import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cefrTier } from "@/lib/content/cefr";
import { SCHOOL_WORLD_KEY } from "@/lib/content/school-world";
import { computeSchoolStreak } from "@/lib/school/school-streak";
import { LumiCharacter } from "@/components/coach/LumiCharacter";
import { PrintButton } from "@/components/school/PrintButton";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { kid?: string; logro?: string };
}

/**
 * CERTIFICADO IMPRIMIBLE — el profesor (o el apoderado) lo imprime para
 * premiar el esfuerzo. Diseño claro para papel (fondo blanco al imprimir).
 */
export default async function CertificadoPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  if (!kidId) redirect("/profiles");

  // RLS: solo lo ven la familia del niño o el staff de su colegio.
  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, total_xp, cefr_level, course_id")
    .eq("id", kidId)
    .single();
  if (!kid) redirect("/profiles");

  const tier = cefrTier(kid.cefr_level);

  let courseName: string | null = null;
  let schoolStreak = 0;
  if (kid.course_id) {
    const { data: course } = await supabase
      .from("courses")
      .select("name")
      .eq("id", kid.course_id)
      .single();
    courseName = course?.name ?? null;

    const { data: sessions = [] } = await supabase
      .from("lesson_sessions")
      .select("world_key, xp_gained, created_at")
      .eq("kid_id", kid.id)
      .eq("world_key", SCHOOL_WORLD_KEY);
    schoolStreak = computeSchoolStreak(sessions ?? []);
  }

  const logro =
    searchParams.logro?.slice(0, 140) ||
    "por su esfuerzo y constancia aprendiendo inglés";

  const fecha = new Date().toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 relative z-10">
      {/* Estilos de impresión: papel blanco, sin botones */}
      <style>{`
        @media print {
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .cert-sheet { box-shadow: none !important; border-color: #7c3aed !important; }
          .cert-sheet, .cert-sheet * { color: #1a2330 !important; }
          .cert-title { color: #7c3aed !important; }
          .cert-name { color: #0e7490 !important; }
        }
      `}</style>

      <div
        className="cert-sheet w-full max-w-2xl bg-white text-slate-800 rounded-2xl border-4 border-purple-500 px-10 py-12 text-center shadow-2xl"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <div className="flex justify-center mb-2">
          <LumiCharacter mood="celebrate" size={110} />
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">IdiomaConnect</div>
        <h1 className="cert-title text-4xl font-bold text-purple-700 mb-6">Certificado de Logro</h1>

        <p className="text-sm text-slate-600 mb-2">Se otorga con orgullo a</p>
        <div className="cert-name text-5xl font-bold text-cyan-700 mb-6" style={{ fontFamily: "inherit" }}>
          {kid.name}
        </div>

        <p className="text-base text-slate-700 mb-6 max-w-md mx-auto">{logro}</p>

        <div className="flex justify-center gap-8 text-sm text-slate-600 mb-8">
          <div>
            <div className="text-2xl font-bold text-slate-800">{kid.cefr_level}</div>
            <div>Nivel {tier.name}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{kid.total_xp}</div>
            <div>XP totales</div>
          </div>
          {schoolStreak > 0 && (
            <div>
              <div className="text-2xl font-bold text-slate-800">🔥 {schoolStreak}</div>
              <div>días de racha</div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end text-xs text-slate-500 pt-6 border-t border-slate-200">
          <span>{courseName ? `Curso ${courseName}` : "Programa familiar"}</span>
          <span>idiomaconnect.com</span>
          <span>{fecha}</span>
        </div>
      </div>

      <div className="no-print mt-6 flex gap-3">
        <PrintButton />
      </div>
      <p className="no-print text-xs text-ink-dim mt-3">
        Consejo: en el diálogo de impresión, desactiva &quot;encabezados y pies de página&quot;.
      </p>
    </main>
  );
}
