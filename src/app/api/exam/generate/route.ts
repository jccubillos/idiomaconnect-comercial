import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildPlacementExam } from "@/lib/content/exam-bank";
import { parseBody } from "@/lib/api/parse-body";

export const runtime = "nodejs";

const Body = z.object({ kidId: z.string().uuid() });

/**
 * Devuelve un examen diagnóstico CEFR desde el BANCO CURADO (no IA).
 * Cada pregunta tiene una sola respuesta correcta verificada; las opciones
 * vienen barajadas y el set de 15 (3 por nivel) varía en cada intento.
 */
export async function POST(req: Request) {
  const body = await parseBody(req, Body);
  if (body instanceof NextResponse) return body;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ questions: buildPlacementExam() });
}
