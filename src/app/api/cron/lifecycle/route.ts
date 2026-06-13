import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  SEQUENCES,
  emailDue,
  purgeDue,
  retentionDeadline,
  qualifiesForOffer,
} from "@/lib/lifecycle/cadence";
import {
  postTrialEmail,
  offer15Email,
  dunningFamilyEmail,
  dunningSchoolEmail,
} from "@/lib/email/lifecycle-templates";
import { sendLifecycleEmail, emailConfigured, unsubscribeUrl } from "@/lib/email/send-lifecycle";
import { createPersonalDiscount } from "@/lib/payments/lemonsqueezy";
import { log } from "@/lib/logging/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * CRON DIARIO DEL CICLO DE VIDA — ejecuta las reglas comerciales:
 *
 *  · Post-trial sin compra → correos cada 2 días ×15, luego cada 7 días ×8.
 *  · Oferta 15% anual (1 vez) si en el trial logró ≥200 XP o subió de nivel.
 *  · Dunning familiar (falla de pago) → cada 2 días ×15; purga a los 30 días.
 *  · Dunning colegios → cada 2 días ×30; purga a los 180 días.
 *  · Purga del trial vencido sin compra a los 30 días.
 *
 * Sin RESEND_API_KEY real, NO envía ni registra (modo dormido): las secuencias
 * parten limpias cuando el correo esté configurado. Las purgas SÍ corren solo
 * si la secuencia de avisos pudo correr (no borramos datos sin haber avisado).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const authorized =
    !!cronSecret &&
    (authHeader === `Bearer ${cronSecret}` || url.searchParams.get("secret") === cronSecret);
  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = createServiceClient();
  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://idiomaconnect.com";
  const billingUrl = `${appUrl}/billing`;

  const stats = { postTrial: 0, offers: 0, dunningFamily: 0, dunningSchool: 0, purged: 0, errors: 0 };

  // 1. Familias + log de correos (agregado por familia/tipo).
  const { data: families = [] } = await svc
    .from("families")
    .select("id, owner_user_id, family_name, plan, trial_ends_at, org_type, payment_failed_at, marketing_opt_out, contact_email, plan_expires_at");

  const { data: logRows = [] } = await svc
    .from("email_log")
    .select("family_id, kind, sent_at")
    .in("kind", ["post_trial", "offer15", "dunning_family", "dunning_school", "hotmart_expiry"]);

  const agg = new Map<string, Map<string, { count: number; last: Date }>>();
  for (const r of logRows ?? []) {
    if (!r.family_id) continue;
    const fam = agg.get(r.family_id) ?? new Map();
    const cur = fam.get(r.kind) ?? { count: 0, last: new Date(0) };
    const at = new Date(r.sent_at);
    fam.set(r.kind, { count: cur.count + 1, last: at > cur.last ? at : cur.last });
    agg.set(r.family_id, fam);
  }
  const logFor = (familyId: string, kind: string) =>
    agg.get(familyId)?.get(kind) ?? { count: 0, last: null as Date | null };

  async function ownerEmail(userId: string): Promise<string | null> {
    const { data } = await svc.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  }

  /** Purga definitiva: storage + usuario auth (cascada borra familia y todo). */
  async function purgeFamily(f: { id: string; owner_user_id: string; family_name: string }) {
    try {
      const { data: files } = await svc.storage.from("avatars").list(f.id);
      if (files?.length) {
        await svc.storage.from("avatars").remove(files.map((x) => `${f.id}/${x.name}`));
      }
    } catch { /* la purga de DB es lo esencial */ }
    const { error } = await svc.auth.admin.deleteUser(f.owner_user_id);
    if (error) {
      stats.errors++;
      log.error("lifecycle.purge_failed", { familyId: f.id, error: error.message });
      return;
    }
    stats.purged++;
    log.info("lifecycle.purged", { familyId: f.id, name: f.family_name });
  }

  for (const f of families ?? []) {
    try {
      /* ── A. TRIAL VENCIDO sin compra (solo familias) ─────────────── */
      if (f.org_type === "family" && f.plan === "trial" && new Date(f.trial_ends_at) < now) {
        const anchor = new Date(f.trial_ends_at);

        // Purga a los 30 días — solo si el sistema de avisos estuvo operativo.
        if (purgeDue("trial", anchor, now)) {
          if (emailConfigured()) await purgeFamily(f);
          continue;
        }

        if (f.marketing_opt_out || !emailConfigured()) continue;
        const email = await ownerEmail(f.owner_user_id);
        if (!email) continue;
        const retention = retentionDeadline("trial", anchor);
        const unsub = unsubscribeUrl(appUrl, f.id);

        // Oferta 15% (una sola vez, tiene prioridad sobre el correo genérico).
        if (logFor(f.id, "offer15").count === 0) {
          const { data: kids = [] } = await svc
            .from("kid_profiles")
            .select("name, total_xp, cefr_level")
            .eq("family_id", f.id);
          if (qualifiesForOffer(kids ?? [])) {
            const code = `TRIAL15-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
            const created = await createPersonalDiscount({
              code,
              name: `Oferta post-trial ${f.family_name}`,
            });
            if ("code" in created) {
              const best = (kids ?? []).reduce((a, b) => (b.total_xp > a.total_xp ? b : a));
              const highlight =
                `${best.name} llegó a ${best.total_xp} XP` +
                (best.cefr_level !== "A1" ? ` y alcanzó el nivel ${best.cefr_level}` : "");
              const tpl = offer15Email({
                familyName: f.family_name,
                kidHighlights: highlight,
                promoUrl: `${billingUrl}?promo=${created.code}`,
                code: created.code,
                retentionDate: retention,
                unsubscribeUrl: unsub,
              });
              const r = await sendLifecycleEmail(svc, {
                familyId: f.id, email, kind: "offer15",
                subject: tpl.subject, html: tpl.html, meta: { code: created.code },
              });
              if (r === "sent") {
                // Registrar el cupón en el catálogo (para ver el % en el admin).
                await svc.from("discount_codes").insert({
                  code: created.code,
                  percent: 15,
                  duration: "once",
                  max_redemptions: 1,
                  expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
                  note: `Oferta post-trial automática · ${f.family_name}`,
                });
                stats.offers++;
                continue;
              }
            }
          }
        }

        // Secuencia post-trial estándar.
        const lg = logFor(f.id, "post_trial");
        if (emailDue(SEQUENCES.post_trial, lg.count, lg.last, anchor, now)) {
          const tpl = postTrialEmail({
            familyName: f.family_name,
            retentionDate: retention,
            billingUrl,
            unsubscribeUrl: unsub,
            emailNumber: lg.count + 1,
          });
          const r = await sendLifecycleEmail(svc, {
            familyId: f.id, email, kind: "post_trial", subject: tpl.subject, html: tpl.html,
          });
          if (r === "sent") stats.postTrial++;
        }
        continue;
      }

      /* ── B. DUNNING — falla de pago (familias y colegios) ────────── */
      if (f.payment_failed_at) {
        const anchor = new Date(f.payment_failed_at);
        const isSchool = f.org_type === "school";
        const retKind = isSchool ? "school" : "family";

        if (purgeDue(retKind, anchor, now)) {
          if (emailConfigured()) await purgeFamily(f);
          continue;
        }

        if (!emailConfigured()) continue;
        const kind = isSchool ? "dunning_school" : "dunning_family";
        const lg = logFor(f.id, kind);
        if (!emailDue(SEQUENCES[kind], lg.count, lg.last, anchor, now)) continue;

        const email = isSchool
          ? (f.contact_email ?? (await ownerEmail(f.owner_user_id)))
          : await ownerEmail(f.owner_user_id);
        if (!email) continue;

        const retention = retentionDeadline(retKind, anchor);
        const tpl = isSchool
          ? dunningSchoolEmail({
              schoolName: f.family_name,
              retentionDate: retention,
              contactEmail: "appidiomaconnect@gmail.com",
            })
          : dunningFamilyEmail({ familyName: f.family_name, retentionDate: retention, billingUrl });

        const r = await sendLifecycleEmail(svc, {
          familyId: f.id, email, kind, subject: tpl.subject, html: tpl.html,
        });
        if (r === "sent") {
          if (isSchool) stats.dunningSchool++;
          else stats.dunningFamily++;
        }
      }
    } catch (err) {
      stats.errors++;
      log.error("lifecycle.family_failed", { familyId: f.id, error: String(err) });
    }
  }

  // ── Recordatorio de vencimiento de paquetes Hotmart (pago único temporal) ──
  // Avisa 7 días antes de que venza el acceso, invitando a renovar/subir directo.
  if (emailConfigured()) {
    for (const f of families ?? []) {
      if (!f.plan_expires_at) continue;
      const exp = new Date(f.plan_expires_at).getTime();
      const daysLeft = Math.ceil((exp - now.getTime()) / 86_400_000);
      if (daysLeft !== 7 && daysLeft !== 1) continue; // dos avisos: a 7 y a 1 día
      const lg = logFor(f.id, "hotmart_expiry");
      if (lg.count >= 2) continue;
      try {
        const email = await ownerEmail(f.owner_user_id);
        if (!email) continue;
        await sendLifecycleEmail(svc, {
          familyId: f.id, email, kind: "hotmart_expiry",
          subject: `Tu acceso a IdiomaConnect vence en ${daysLeft} día(s)`,
          html: `<p>Hola <b>${f.family_name}</b>, tu acceso vence en <b>${daysLeft} día(s)</b>. ` +
                `Renueva o pásate al plan anual o vitalicio para que tus niños no pierdan su progreso: ` +
                `<a href="${appUrl}/billing">${appUrl}/billing</a></p>`,
        });
      } catch { /* best effort */ }
    }
  }

  // Mantenimiento: borrar contadores de límites ya vencidos (ventanas viejas).
  try {
    await svc
      .from("rate_limits")
      .delete()
      .lt("window_ends_at", new Date(now.getTime() - 86_400_000).toISOString());
  } catch { /* tabla aún no migrada */ }

  log.info("lifecycle.done", stats);
  return NextResponse.json({ ok: true, emailMode: emailConfigured() ? "live" : "dormant", ...stats });
}
