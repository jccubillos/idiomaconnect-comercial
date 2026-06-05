import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { applySm2 } from "@/lib/pedagogy/srs";

export const runtime = "nodejs";

const BodySchema = z.object({
  cardId: z.string().uuid(),
  quality: z.number().int().min(0).max(5),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: card, error: cardErr } = await supabase
    .from("srs_cards").select("*").eq("id", body.cardId).single();
  if (cardErr || !card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const next = applySm2(
    {
      intervalDays: card.interval_days,
      easeFactor: card.ease_factor,
      repetition: card.repetition,
      dueAt: new Date(card.due_at),
    },
    body.quality,
  );

  const { error } = await supabase
    .from("srs_cards")
    .update({
      interval_days: next.intervalDays,
      ease_factor: next.easeFactor,
      repetition: next.repetition,
      due_at: next.dueAt.toISOString(),
      last_quality: body.quality,
    })
    .eq("id", body.cardId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    nextDueAt: next.dueAt.toISOString(),
    intervalDays: next.intervalDays,
  });
}
