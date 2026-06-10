import { createServiceClient } from "@/lib/supabase/server";
import { unsubscribeToken } from "@/lib/email/send-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Baja de correos PROMOCIONALES (post-trial, ofertas). Link firmado con HMAC
 * incluido en cada correo de marketing. Los avisos de cobro/cuenta no se ven
 * afectados (son transaccionales).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const familyId = url.searchParams.get("f") ?? "";
  const token = url.searchParams.get("t") ?? "";

  const page = (title: string, body: string) =>
    new Response(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;background:#0c1322;color:#eef2f8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
<div style="max-width:420px;text-align:center;padding:32px;">
  <div style="font-size:40px;margin-bottom:12px;">📭</div>
  <h1 style="font-size:20px;margin:0 0 10px;">${title}</h1>
  <p style="font-size:14px;color:#9aa6b8;line-height:1.6;">${body}</p>
</div></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );

  if (!familyId || token !== unsubscribeToken(familyId)) {
    return page("Enlace no válido", "Este enlace de baja no es válido o ya expiró.");
  }

  const svc = createServiceClient();
  await svc.from("families").update({ marketing_opt_out: true }).eq("id", familyId);

  return page(
    "Listo, no te molestamos más",
    "No volverás a recibir correos promocionales de IdiomaConnect. Los avisos importantes sobre tu cuenta o pagos seguirán llegando cuando corresponda.",
  );
}
