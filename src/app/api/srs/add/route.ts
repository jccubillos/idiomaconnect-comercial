import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  kidId: z.string().uuid(),
  cards: z.array(z.object({
    word_en: z.string().min(1),
    translation_es: z.string().optional(),
    example: z.string().optional(),
  })).min(1).max(20),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = body.cards.map((c) => ({
    kid_id: body.kidId,
    word_en: c.word_en.toLowerCase().trim(),
    translation_es: c.translation_es ?? null,
    example_sentence: c.example ?? null,
    interval_days: 1,
    ease_factor: 2.5,
    repetition: 0,
    due_at: new Date().toISOString(),
  }));

  // upsert on (kid_id, lower(word_en)) — Supabase doesn't support function-based unique
  // upsert through plain insert with on conflict via the unique index we created.
  const { error } = await supabase.from("srs_cards").upsert(rows, {
    onConflict: "kid_id,word_en",
    ignoreDuplicates: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ added: rows.length });
}
