/**
 * Build a weekly progress email body. Pure function, no I/O.
 */

import type { KidStats } from "@/lib/content/trophies";

interface KidRow {
  name: string;
  emoji: string;
  weekXp: number;
  totalXp: number;
  weekSessions: number;
  streak: number;
  weakSkill: string | null;
  topMode: string | null;
}

export function buildWeeklyReportHTML(args: {
  parentName: string;
  rows: KidRow[];
  appUrl: string;
}): { subject: string; html: string; text: string } {
  const { parentName, rows, appUrl } = args;
  const totalWeekXp = rows.reduce((acc, r) => acc + r.weekXp, 0);
  const totalSessions = rows.reduce((acc, r) => acc + r.weekSessions, 0);

  const subject = `Reporte semanal — ${totalWeekXp} XP en ${rows.length} ${rows.length === 1 ? "kid" : "kids"}`;

  const kidsHtml = rows.map((r) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;">
        <strong>${r.emoji} ${r.name}</strong><br>
        <span style="color:#666;font-size:12px;">${r.weekSessions} sesiones · 🔥 ${r.streak} días</span>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;">
        <strong style="color:#39FF14;">${r.weekXp} XP</strong><br>
        <span style="color:#666;font-size:12px;">total ${r.totalXp}</span>
      </td>
    </tr>
    ${r.weakSkill ? `<tr><td colspan="2" style="padding:0 8px 12px;color:#666;font-size:12px;">💡 Practicar más <b>${r.weakSkill}</b></td></tr>` : ""}
  `).join("");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#101417;color:#e0e2e6;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#1d2023;border-radius:16px;padding:24px;">
    <h1 style="color:#00EEFC;margin:0 0 8px;">¡Hola ${parentName}!</h1>
    <p style="color:#a8aab0;margin:0 0 16px;">Resumen de tu familia esta semana:</p>
    <div style="background:#272a2d;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center;">
      <div style="font-size:32px;font-weight:bold;color:#39FF14;">${totalWeekXp} XP</div>
      <div style="color:#a8aab0;font-size:13px;">${totalSessions} sesiones totales</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      ${kidsHtml}
    </table>
    <a href="${appUrl}/parent" style="display:inline-block;margin-top:20px;background:#FF4B4B;color:white;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">
      Ver dashboard completo →
    </a>
    <p style="color:#a8aab0;font-size:11px;margin-top:20px;">
      Este es el reporte semanal de IdiomaConnect. Puedes desactivarlo en
      <a href="${appUrl}/account/settings" style="color:#00EEFC;">settings</a>.
    </p>
  </div>
</body>
</html>`.trim();

  const text =
    `Hola ${parentName}.\nResumen semanal: ${totalWeekXp} XP en ${totalSessions} sesiones.\n` +
    rows.map((r) => `- ${r.name}: ${r.weekXp} XP, ${r.weekSessions} sesiones, racha ${r.streak}d`).join("\n") +
    `\nDashboard: ${appUrl}/parent`;

  return { subject, html, text };
}
