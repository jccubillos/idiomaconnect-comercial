import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logging/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CUENTA DEMO PARA AFILIADOS — crea una familia de prueba YA poblada (2 niños con
 * avance) y devuelve credenciales de un solo uso para entrar y grabar la app.
 *
 *  · Aislada: cada visita crea su PROPIA cuenta → los afiliados no se pisan entre sí.
 *  · Acceso completo: como trial vigente, ve Arena/Reto/Duelo. Trial largo (1 año).
 *  · Sin correos: marketing_opt_out = true → no entra al ciclo de vida ni gasta envíos.
 *  · Anti-abuso: límite por IP. No se enlaza desde el sitio (se comparte en el kit).
 */
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const rl = checkRateLimit(`demo:${ip}`, { limit: 5, windowSec: 60 * 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados accesos demo desde esta red. Intenta de nuevo en una hora." },
      { status: 429 },
    );
  }

  let svc;
  try {
    svc = createServiceClient();
  } catch {
    return NextResponse.json({ error: "El demo no está disponible en este momento." }, { status: 503 });
  }

  const rand = crypto.randomUUID().slice(0, 8);
  const email = `demo+${rand}@idiomaconnect.com`;
  const password = `Demo-${crypto.randomUUID().slice(0, 12)}`;

  // 1. Crear el usuario → el trigger handle_new_user crea su familia en plan 'trial'.
  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { family_name: "Familia Demo" },
  });
  if (createErr || !created?.user) {
    log.error("demo.create_failed", { error: createErr?.message });
    return NextResponse.json({ error: "No se pudo crear la cuenta demo." }, { status: 500 });
  }
  const userId = created.user.id;

  // 2. Localizar la familia creada por el trigger.
  const { data: family } = await svc
    .from("families")
    .select("id")
    .eq("owner_user_id", userId)
    .single();
  if (!family) {
    return NextResponse.json({ error: "No se pudo preparar la cuenta demo." }, { status: 500 });
  }

  // 3. Trial largo (1 año) + sin correos: no ensucia el ciclo de vida ni la reputación de envío.
  const yearAhead = new Date();
  yearAhead.setFullYear(yearAhead.getFullYear() + 1);
  await svc
    .from("families")
    .update({
      family_name: "Familia Demo",
      trial_ends_at: yearAhead.toISOString(),
      marketing_opt_out: true,
      max_kids: 6,
    })
    .eq("id", family.id);

  // 4. Sembrar 2 niños con gustos y avance creíbles (lo que el afiliado mostrará en cámara).
  const { data: kids } = await svc
    .from("kid_profiles")
    .insert([
      { family_id: family.id, name: "Mateo", emoji: "⚽", color_hex: "#00EEFC", hobbies: "fútbol, videojuegos, dinosaurios", grade: "5º básico", total_xp: 480, cefr_level: "A2" },
      { family_id: family.id, name: "Sofía", emoji: "🎨", color_hex: "#FF66C4", hobbies: "música, dibujo, gatos", grade: "3º básico", total_xp: 240, cefr_level: "A1" },
    ])
    .select("id, name");

  // 5. Sembrar sesiones recientes para que el panel de padres muestre actividad por habilidad.
  if (kids?.length) {
    const skills = ["vocabulary", "grammar", "listening", "speaking", "reading", "writing"] as const;
    const types = ["lesson", "battle", "flashcards", "pronunciation", "story_fill", "listen_id"];
    const rows = kids.flatMap((k, ki) =>
      Array.from({ length: 6 }, (_, d) => {
        const day = new Date();
        day.setDate(day.getDate() - d);
        return {
          kid_id: k.id,
          lesson_type: types[(d + ki) % types.length],
          skill: skills[(d + ki) % skills.length],
          score_pct: 70 + ((d * 7 + ki * 11) % 30),
          xp_gained: 20 + ((d * 5) % 25),
          attempts: 1,
          duration_seconds: 120 + d * 20,
          created_at: day.toISOString(),
        };
      }),
    );
    await svc.from("lesson_sessions").insert(rows);
  }

  log.info("demo.created", { familyId: family.id });
  return NextResponse.json({ email, password });
}
