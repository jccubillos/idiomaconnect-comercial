import type { Metadata } from "next";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";
import { LumiCharacter } from "@/components/coach/LumiCharacter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "⚔️ Te retaron a una Battle de inglés",
  description: "Acepta el reto de vocabulario en inglés de IdiomaConnect. ¿Puedes superar su puntaje?",
};

interface PageProps {
  params: { id: string };
}

/**
 * PÁGINA PÚBLICA del reto — el link que viaja por WhatsApp.
 * Cualquiera la ve; para JUGAR se necesita cuenta (trial gratis) → motor viral.
 */
export default async function RetoPage({ params }: PageProps) {
  // El reto se lee con service role (tabla solo-servidor); solo mostramos el teaser.
  let reto: {
    id: string;
    creator_name: string;
    creator_emoji: string | null;
    creator_level: string;
    score_pct: number;
    plays: number;
    expires_at: string;
  } | null = null;
  try {
    const svc = createServiceClient();
    const { data } = await svc
      .from("battle_challenges")
      .select("id, creator_name, creator_emoji, creator_level, score_pct, plays, expires_at")
      .eq("id", params.id)
      .single();
    reto = data;
  } catch { /* migración pendiente o id inválido */ }

  const expired = reto ? new Date(reto.expires_at).getTime() < Date.now() : false;

  if (!reto || expired) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
        <GlassCard strong className="p-8 max-w-md text-center">
          <div className="text-4xl mb-3">😅</div>
          <h1 className="text-xl font-extrabold mb-2">Este reto ya no está disponible</h1>
          <p className="text-sm text-ink-dim mb-5">
            Los retos duran 30 días. ¡Pero puedes crear el tuyo y retar a tus amigos!
          </p>
          <Link href="/"><NeonButton variant="primary">Conocer IdiomaConnect</NeonButton></Link>
        </GlassCard>
      </main>
    );
  }

  // ¿Hay sesión? → mostrar los perfiles de la familia para aceptar el reto.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let kids: Array<{ id: string; name: string; emoji: string; avatar_url: string | null; color_hex: string }> = [];
  if (user) {
    const { data } = await supabase
      .from("kid_profiles")
      .select("id, name, emoji, avatar_url, color_hex")
      .is("archived_at", null)
      .order("created_at", { ascending: true })
      .limit(6);
    kids = data ?? [];
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <div className="max-w-md w-full">
        <GlassCard strong glowColor="red" className="p-8 text-center border-2 border-neon-red/50">
          <div className="flex justify-center mb-2">
            <LumiCharacter mood="suggest" size={110} />
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-neon-red mb-3">
            ⚔️ ¡Te han retado!
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-3xl">{reto.creator_emoji ?? "👤"}</span>
            <span className="text-2xl font-extrabold">{reto.creator_name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neon-purple/15 text-neon-purple border border-neon-purple/40">
              {reto.creator_level}
            </span>
          </div>
          <p className="text-sm text-ink-dim mb-4">sacó en una Battle de vocabulario en inglés:</p>

          <div className="text-6xl font-extrabold text-glow-red text-neon-red mb-1">{reto.score_pct}%</div>
          <p className="text-sm font-bold mb-6">¿Puedes superarlo con las MISMAS palabras?</p>

          {user ? (
            kids.length > 0 ? (
              <>
                <p className="text-xs text-ink-dim mb-3">Elige quién acepta el reto:</p>
                <div className="grid grid-cols-2 gap-2">
                  {kids.map((k) => (
                    <Link key={k.id} href={`/reto/${reto.id}/jugar?kid=${k.id}`}>
                      <GlassCard className="p-3 text-center hover:scale-[1.03] transition-transform border border-neon-cyan/30">
                        <div className="mx-auto mb-1" style={{ width: "fit-content" }}>
                          <Avatar src={k.avatar_url} emoji={k.emoji ?? "👤"} name={k.name} ringColor={k.color_hex} size="sm" />
                        </div>
                        <div className="font-bold text-sm">{k.name}</div>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link href="/onboarding">
                <NeonButton variant="primary" size="lg" className="w-full">Crear el primer perfil y jugar</NeonButton>
              </Link>
            )
          ) : (
            <>
              <Link href={`/login?next=/reto/${reto.id}`}>
                <NeonButton variant="primary" size="lg" className="w-full mb-3">Aceptar el reto</NeonButton>
              </Link>
              <p className="text-xs text-ink-dim">
                ¿No tienes cuenta?{" "}
                <Link href="/signup" className="text-neon-cyan underline font-bold">
                  Créala gratis (7 días de prueba)
                </Link>{" "}
                y vuelve a abrir este enlace.
              </p>
            </>
          )}
        </GlassCard>

        <p className="text-center text-[11px] text-ink-dim mt-4">
          {reto.plays > 0 ? `${reto.plays} jugador(es) ya lo intentaron · ` : ""}
          IdiomaConnect — el tutor de inglés que conoce a tu familia
        </p>
      </div>
    </main>
  );
}
