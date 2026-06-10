import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { audit } from "@/lib/superadmin/auth";

export const runtime = "nodejs";

const Body = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "won", "lost"]),
});

/** Cambia el estado de un lead de colegio (nuevo → contactado → ganado/perdido). */
export async function PATCH(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { error } = await auth.svc
    .from("school_leads")
    .update({ status: body.status })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(auth.svc, auth.userId, "lead_status_changed", { id: body.id, status: body.status });
  return NextResponse.json({ ok: true });
}
