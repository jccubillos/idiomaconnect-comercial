import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateSentencesToOrder } from "@/lib/groq/sentences";
import { getUniversalWorld, buildPersonalWorld } from "@/lib/content/worlds";
import { getCefrInfo } from "@/lib/content/cefr";

export const runtime = "nodejs";

const Body = z.object({
  kidId: z.string().uuid(),
  worldKey: z.string().default("grammar"),
  count: z.number().int().min(4).max(8).default(5),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: kid } = await supabase.from("kid_profiles").select("*").eq("id", body.kidId).single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  const cefr = getCefrInfo(kid.total_xp);
  const world =
    body.worldKey === "personal"
      ? buildPersonalWorld({ kidName: kid.name, hobbies: kid.hobbies, color: kid.color_hex, emoji: kid.emoji })
      : getUniversalWorld(body.worldKey) ?? getUniversalWorld("grammar")!;

  const r = await generateSentencesToOrder({
    kid: {
      name: kid.name, gender: null, ageDesc: "adolescente", grade: kid.grade,
      hobbies: kid.hobbies, tone: kid.tone, familyMembers: [],
      cefrCode: cefr.code, cefrName: cefr.name, recentTopics: [],
    },
    world: { key: world.key, name: world.name, tagline: world.tagline },
    count: body.count,
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 });
  return NextResponse.json({ items: r.items });
}
