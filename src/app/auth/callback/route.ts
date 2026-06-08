import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Destino tras confirmar: usar `next` solo si es una ruta interna válida
  // (evita el bug de redirigir a "null" o a una URL externa).
  const rawNext = url.searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") ? rawNext : "/start";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // El enlace ya fue usado o expiró: llevar al login con aviso claro.
      return NextResponse.redirect(new URL("/login?confirmed=1", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
