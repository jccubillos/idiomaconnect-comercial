import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const REASONS = ["soporte", "pagos", "colegios", "sugerencia", "otro"] as const;

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Formulario público de contacto (/contacto), con adjunto opcional.
 * El adjunto se guarda en el bucket PRIVADO "contact-files" (solo lo ve el equipo).
 */
export async function POST(req: Request) {
  // Anti-spam: máximo 5 mensajes por hora por IP.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = checkRateLimit(`contact:${ip}`, { limit: 5, windowSec: 60 * 60 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiados mensajes. Intenta más tarde." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido." }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const reason = String(form.get("reason") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  const file = form.get("file");

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Ingresa tu nombre." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 400 });
  }
  if (!(REASONS as readonly string[]).includes(reason)) {
    return NextResponse.json({ error: "Selecciona el motivo del contacto." }, { status: 400 });
  }
  if (message.length > 3000) {
    return NextResponse.json({ error: "El mensaje es demasiado largo (máx. 3000)." }, { status: 400 });
  }

  const svc = createServiceClient();

  // Adjunto opcional: validar tipo y tamaño, subir al bucket privado.
  let filePath: string | null = null;
  if (file instanceof Blob && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "El archivo supera los 5 MB." }, { status: 413 });
    }
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Formato no permitido. Acepta: imagen (png/jpg/webp), PDF o Word." },
        { status: 415 },
      );
    }
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await svc.storage.from("contact-files").upload(path, file, {
      contentType: file.type,
    });
    if (upErr) {
      return NextResponse.json(
        { error: "No se pudo subir el archivo. Envía el mensaje sin adjunto o intenta de nuevo." },
        { status: 502 },
      );
    }
    filePath = path;
  }

  const { error } = await svc.from("contact_messages").insert({
    name,
    email,
    phone: phone || null,
    reason,
    message: message || null,
    file_path: filePath,
  });
  if (error) {
    const friendly = error.message.includes("contact_messages")
      ? "El sistema de contacto se está activando (falta aplicar la migración 0010)."
      : "No se pudo registrar el mensaje. Intenta de nuevo.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
