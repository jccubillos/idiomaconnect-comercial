import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/email/resend";
import { buildWeeklyReportHTML } from "@/lib/email/weekly-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Triggered by Vercel Cron (vercel.json) every Friday 18:00 UTC.
 * Iterates all active families, summarizes the last 7 days per kid,
 * and sends an email via Resend.
 *
 * Seguridad: exige el CRON_SECRET. Vercel Cron lo envía automáticamente como
 * `Authorization: Bearer <CRON_SECRET>` cuando la env var está configurada.
 * NO confiamos en `x-vercel-cron` solo: ese header es falsificable por cualquiera.
 * Para pruebas locales: `?secret=<CRON_SECRET>`.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const secretParam = url.searchParams.get("secret");

  // Falla cerrado: sin CRON_SECRET configurado, nadie pasa.
  const authorized =
    !!cronSecret &&
    (authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret);

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://idiomaconnect.app";

  const { data: families = [] } = await supabase
    .from("families")
    .select("id, owner_user_id, family_name")
    .in("plan", ["trial", "family_monthly", "family_yearly"]);

  const summaries: Array<{ familyId: string; email: string; subject: string; sent: boolean }> = [];

  for (const family of families ?? []) {
    // Get parent email from auth.users
    const { data: { user } } = await supabase.auth.admin.getUserById(family.owner_user_id);
    if (!user?.email) continue;

    const { data: kids = [] } = await supabase
      .from("kid_profiles")
      .select("id, name, emoji, total_xp")
      .eq("family_id", family.id)
      .is("archived_at", null);

    const rows = await Promise.all((kids ?? []).map(async (k) => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const { data: weekSessions = [] } = await supabase
        .from("lesson_sessions")
        .select("xp_gained, skill, lesson_type, created_at")
        .eq("kid_id", k.id)
        .gte("created_at", since);

      const weekXp = (weekSessions ?? []).reduce((a, s) => a + (s.xp_gained ?? 0), 0);
      const weekSessions_n = weekSessions?.length ?? 0;

      // Recompute streak using all sessions (cheap-ish, fine for weekly cron)
      const { data: allSessions = [] } = await supabase
        .from("lesson_sessions")
        .select("created_at, skill")
        .eq("kid_id", k.id);
      const days = new Set((allSessions ?? []).map((s) => s.created_at.slice(0, 10)));
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        if (days.has(d.toISOString().slice(0, 10))) streak += 1;
        else if (i > 0) break;
      }

      const skillCounts: Record<string, number> = {};
      for (const s of allSessions ?? []) {
        if (s.skill) skillCounts[s.skill] = (skillCounts[s.skill] ?? 0) + 1;
      }
      const weakSkill =
        Object.entries(skillCounts).sort((a, b) => a[1] - b[1])[0]?.[0] ?? null;

      return {
        name: k.name,
        emoji: k.emoji,
        weekXp,
        totalXp: k.total_xp,
        weekSessions: weekSessions_n,
        streak,
        weakSkill,
        topMode: null,
      };
    }));

    if (!rows.length) continue;

    const { subject, html, text } = buildWeeklyReportHTML({
      parentName: family.family_name,
      rows,
      appUrl,
    });

    try {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject,
        html,
        text,
      });
      summaries.push({ familyId: family.id, email: user.email, subject, sent: true });
    } catch (err) {
      console.error(`[cron weekly] family=${family.id}`, err);
      summaries.push({ familyId: family.id, email: user.email, subject, sent: false });
    }
  }

  return NextResponse.json({ processed: summaries.length, summaries });
}
