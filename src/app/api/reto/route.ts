import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hasPlusAccess } from "@/lib/billing/access";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const WordSchema = z.object({
  en: z.string().min(1).max(60),
  es: z.string().min(1).max(80),
  pron: z.string().max(80).default(""),
  options: z.array(z.string().min(1).max(80)).min(2).max(6),
});

const Body = z.object({
  kidId: z.string().uuid(),
  scorePct: z.number().int().min(0).max(100),
  words: z.array(WordSchema).min(4).max(20),
});

/**
 * Crea un ⚔️ RETO A UN AMIGO (exclusivo Plus/Vitalicio; el trial vigente también,
 * como gancho). Guarda las MISMAS palabras de la batalla + el puntaje del retador
 * y devuelve el link público para compartir por WhatsApp.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Anti-abuso: máximo 10 retos por hora por usuario.
  const rl = checkRateLimit(`reto:${user.id}`, { limit: 10, windowSec: 3600 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiados retos seguidos. Intenta en un rato." }, { status: 429 });
  }

  // RLS garantiza que el kid es de la familia (o curso) del usuario.
  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, cefr_level, family_id")
    .eq("id", body.kidId)
    .single();
  if (!kid) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  // Candado PLUS (verificado en servidor, no se puede saltar).
  const { data: fam } = await supabase
    .from("families")
    .select("plan, trial_ends_at")
    .eq("id", kid.family_id)
    .single();
  if (!fam || !hasPlusAccess(fam)) {
    return NextResponse.json(
      { error: "Retar a un amigo es exclusivo del plan Plus.", code: "plus_required" },
      { status: 403 },
    );
  }

  const svc = createServiceClient();
  const { data: row, error } = await svc
    .from("battle_challenges")
    .insert({
      creator_kid_id: kid.id,
      creator_name: kid.name,
      creator_emoji: kid.emoji,
      creator_level: kid.cefr_level,
      score_pct: body.scorePct,
      words: body.words as never,
    })
    .select("id")
    .single();

  if (error || !row) {
    const friendly = error?.message.includes("battle_challenges")
      ? "Falta aplicar la migración 0015 en la base de datos."
      : "No se pudo crear el reto. Intenta de nuevo.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://idiomaconnect.com";
  return NextResponse.json({ ok: true, id: row.id, url: `${appUrl}/reto/${row.id}` });
}
