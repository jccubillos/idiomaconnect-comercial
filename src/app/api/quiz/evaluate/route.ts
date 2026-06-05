import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateQuiz, calculateXp, XP_PER_LESSON } from "@/lib/pedagogy/evaluate-quiz";

export const runtime = "nodejs";

const BodySchema = z.object({
  mc: z.array(z.object({
    q: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
  })),
  fitb: z.array(z.object({
    sentence: z.string(),
    answer: z.string(),
    hint: z.string(),
  })),
  mcAnswers: z.record(z.string(), z.string()),
  fitbAnswers: z.record(z.string(), z.string()),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const mcAns: Record<number, string> = {};
  for (const [k, v] of Object.entries(body.mcAnswers)) mcAns[Number(k)] = v;
  const fitbAns: Record<number, string> = {};
  for (const [k, v] of Object.entries(body.fitbAnswers)) fitbAns[Number(k)] = v;

  const evaluation = evaluateQuiz(body.mc, body.fitb, mcAns, fitbAns);
  const xp = calculateXp(evaluation.scorePct);

  return NextResponse.json({
    ...evaluation,
    xp,
    xpMax: XP_PER_LESSON,
  });
}
