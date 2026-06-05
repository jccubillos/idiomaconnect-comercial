import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCefrInfo, placementXp } from "@/lib/content/cefr";
import { log } from "@/lib/logging/logger";

export const runtime = "nodejs";

const BodySchema = z.object({
  kidId: z.string().uuid(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

/**
 * Aplica el resultado del examen diagnóstico como NIVEL DE PARTIDA del niño.
 *
 * Como todo el sistema deriva el CEFR del total_xp, "fijar" el nivel = subir el
 * total_xp hasta el umbral de ese nivel. Es un PISO: nunca baja a un niño que ya
 * está más avanzado por sus lecciones diarias (no se castiga un mal día de examen).
 */
export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: String(e) }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS garantiza que solo se lea/escriba un kid de la propia familia.
  const { data: kid, error: kidErr } = await supabase
    .from("kid_profiles")
    .select("id, total_xp")
    .eq("id", body.kidId)
    .single();
  if (kidErr || !kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  // Piso: el XP queda en el máximo entre lo que ya tenía y el umbral del nivel.
  const newTotal = placementXp(kid.total_xp, body.level);
  const cefr = getCefrInfo(newTotal);

  const { error: updErr } = await supabase
    .from("kid_profiles")
    .update({ total_xp: newTotal, cefr_level: cefr.code })
    .eq("id", body.kidId);
  if (updErr) {
    log.warn("exam.place.failed", { error: updErr.message });
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  log.info("exam.place.ok", { level: cefr.code, totalXp: newTotal });
  return NextResponse.json({
    applied: true,
    cefr: { code: cefr.code, name: cefr.name, progress: cefr.progress, nextLabel: cefr.nextLabel },
    totalXp: newTotal,
  });
}
