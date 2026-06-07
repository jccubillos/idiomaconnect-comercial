import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  institutionName: z.string().min(2).max(160),
  address: z.string().max(200).optional(),
  comuna: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
  contactName: z.string().min(2).max(120),
  contactRole: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email(),
  numStudents: z.number().int().min(1).max(100000).optional(),
  levels: z.enum(["basica", "media", "ambos"]).optional(),
  hasEnglishTeacher: z.boolean().optional(),
  message: z.string().max(2000).optional(),
});

/**
 * Recibe una solicitud del formulario "Colegios e Instituciones".
 * Ruta pública (cualquiera puede enviar). RLS permite solo INSERT.
 */
export async function POST(req: Request) {
  // Rate limit por IP para evitar spam.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = checkRateLimit(`lead:${ip}`, { limit: 5, windowSec: 60 * 60 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, { status: 429 });
  }

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Revisa los datos del formulario." }, { status: 400 }); }

  const supabase = createClient();
  const { error } = await supabase.from("school_leads").insert({
    institution_name: body.institutionName.trim(),
    address: body.address?.trim() || null,
    comuna: body.comuna?.trim() || null,
    region: body.region?.trim() || null,
    contact_name: body.contactName.trim(),
    contact_role: body.contactRole?.trim() || null,
    phone: body.phone?.trim() || null,
    email: body.email.trim().toLowerCase(),
    num_students: body.numStudents ?? null,
    levels: body.levels ?? null,
    has_english_teacher: body.hasEnglishTeacher ?? null,
    message: body.message?.trim() || null,
  });

  if (error) return NextResponse.json({ error: "No se pudo enviar. Intenta de nuevo." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
