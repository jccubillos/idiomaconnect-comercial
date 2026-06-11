import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getResend, FROM_EMAIL } from "@/lib/email/resend";
import { emailConfigured } from "@/lib/email/send-lifecycle";

const NOTIFY_EMAIL = process.env.CONTACT_NOTIFY_EMAIL ?? "appidiomaconnect@gmail.com";

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

  // Aviso al equipo: un colegio interesado es la venta más valiosa.
  if (emailConfigured()) {
    try {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        subject: `🏫 Nuevo lead de colegio: ${body.institutionName.trim()}`,
        html: `<h2>Nueva solicitud desde idiomaconnect.com/colegios</h2>
<p><b>Institución:</b> ${body.institutionName.trim()}<br/>
<b>Contacto:</b> ${body.contactName.trim()}${body.contactRole ? ` (${body.contactRole.trim()})` : ""}<br/>
<b>Correo:</b> ${body.email.trim().toLowerCase()}<br/>
<b>Teléfono:</b> ${body.phone?.trim() || "—"}<br/>
<b>Alumnos:</b> ${body.numStudents ?? "—"} · <b>Niveles:</b> ${body.levels ?? "—"}</p>
<p><b>Mensaje:</b><br/>${(body.message?.trim() || "—").replace(/\n/g, "<br/>")}</p>
<p style="color:#888;font-size:12px">También queda registrado en el dashboard /admin → pestaña Leads.</p>`,
      });
    } catch { /* sin correo configurado aún */ }
  }

  return NextResponse.json({ ok: true });
}
