import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildPersonalTalkPrompt } from "@/lib/content/personal-talk";

export const runtime = "nodejs";

const BodySchema = z.object({ kidId: z.string().uuid() });

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, hobbies")
    .eq("id", body.kidId)
    .single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  // Pregunta personalizada (curada + hobbies del perfil), sin costo de IA.
  const prompt = buildPersonalTalkPrompt({
    hobbies: kid.hobbies,
    seed: Math.floor(Math.random() * 1000),
  });

  return NextResponse.json({ prompt });
}
