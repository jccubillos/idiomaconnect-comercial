import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  generateMinimalPairs,
  generateListenIdItems,
  generateShadowPhrases,
  generateMemoryPairs,
} from "@/lib/groq/listening";
import { getCefrInfo } from "@/lib/content/cefr";
import { parseBody } from "@/lib/api/parse-body";
import { enforceLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  kidId: z.string().uuid(),
  mode: z.enum(["minimal_pairs", "listen_id", "shadow", "memory_match"]),
  count: z.number().int().min(5).max(10).default(6),
});

export async function POST(req: Request) {
  const body = await parseBody(req, Body);
  if (body instanceof NextResponse) return body;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await enforceLimit(user.id, "llmGenerate");
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Cuota alcanzada. Vuelve en ${Math.ceil(rl.resetIn / 60)} min.`, code: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } },
    );
  }

  const { data: kid } = await supabase.from("kid_profiles").select("*").eq("id", body.kidId).single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });
  const cefr = getCefrInfo(kid.total_xp);
  const kidInput = {
    name: kid.name, gender: null, ageDesc: "adolescente",
    grade: kid.grade, hobbies: kid.hobbies, tone: kid.tone,
    familyMembers: [], cefrCode: cefr.code, cefrName: cefr.name, recentTopics: [],
  };

  let result;
  if (body.mode === "minimal_pairs") result = await generateMinimalPairs(kidInput);
  else if (body.mode === "listen_id") result = await generateListenIdItems(kidInput, body.count);
  else if (body.mode === "shadow") result = await generateShadowPhrases(kidInput);
  else result = await generateMemoryPairs(kidInput);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ data: result.data });
}
