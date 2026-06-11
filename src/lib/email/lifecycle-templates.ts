/**
 * Plantillas de correos del ciclo de vida (en español).
 * Todas devuelven { subject, html }. El HTML es simple y compatible con
 * clientes de correo (tablas no, estilos inline sí).
 */

const BRAND = "#00b8d4";
const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

function shell(title: string, bodyHtml: string, footerHtml: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a2330;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;padding:18px 0;">
      <span style="font-size:22px;font-weight:800;color:${BRAND};">IdiomaConnect</span>
    </div>
    <div style="background:#ffffff;border-radius:14px;padding:28px 24px;box-shadow:0 1px 4px rgba(0,0,0,.08);">
      <h1 style="font-size:20px;margin:0 0 14px;">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="text-align:center;font-size:11px;color:#8a94a3;padding:18px 8px;line-height:1.6;">
      ${footerHtml}
    </div>
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<div style="text-align:center;margin:22px 0;">
    <a href="${href}" style="background:${BRAND};color:#fff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:10px;display:inline-block;">${label}</a>
  </div>`;
}

const p = (html: string) => `<p style="font-size:14px;line-height:1.7;margin:0 0 12px;">${html}</p>`;

function marketingFooter(unsubscribeUrl: string): string {
  return `Recibes este correo porque probaste IdiomaConnect.<br/>
  <a href="${unsubscribeUrl}" style="color:#8a94a3;">No quiero recibir más correos promocionales</a>`;
}

const billingFooter = `Este es un aviso sobre el estado de tu cuenta IdiomaConnect.`;

/* ── Post-trial: invitación a contratar (cada 2 días ×15, luego 7 días ×8) ── */
export function postTrialEmail(args: {
  familyName: string;
  retentionDate: Date;
  billingUrl: string;
  unsubscribeUrl: string;
  emailNumber: number; // 1..23 — varía el tono
}): { subject: string; html: string } {
  const { familyName, retentionDate, billingUrl, unsubscribeUrl, emailNumber } = args;
  const early = emailNumber <= 3;
  const subject = early
    ? "Tu prueba de IdiomaConnect terminó — el progreso de tus niños te espera"
    : `El progreso de tus niños sigue guardado (hasta el ${fmtDate(retentionDate)})`;
  const html = shell(
    early ? "¡No pierdas el impulso! 🚀" : "Su progreso en inglés sigue ahí 📚",
    [
      p(`Hola <b>${familyName}</b>,`),
      p(
        early
          ? "La prueba gratis de 7 días terminó, pero el viaje en inglés de tus niños recién comienza. Su XP, niveles, rachas y trofeos están guardados esperándolos."
          : "Solo un recordatorio: el avance de tus niños en IdiomaConnect sigue guardado y pueden retomarlo exactamente donde quedaron.",
      ),
      p(
        `⏳ <b>Importante:</b> los datos y avances se conservan hasta el <b>${fmtDate(retentionDate)}</b>. Después de esa fecha se eliminan definitivamente.`,
      ),
      button(billingUrl, "Reactivar el aprendizaje"),
      p(`Planes desde <b>US$7,42/mes</b> (anual) · hasta 6 perfiles · cancela cuando quieras.`),
    ].join(""),
    marketingFooter(unsubscribeUrl),
  );
  return { subject, html };
}

/* ── Oferta 15%: felicitación por el avance + descuento anual personalizado ── */
export function offer15Email(args: {
  familyName: string;
  kidHighlights: string; // ej. "Martina llegó a 230 XP y subió a A2"
  promoUrl: string;      // /billing?promo=TRIAL15-XXXX
  code: string;
  retentionDate: Date;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const { familyName, kidHighlights, promoUrl, code, retentionDate, unsubscribeUrl } = args;
  return {
    subject: "🏆 ¡Felicitaciones por su avance! Te regalamos un 15% para continuar",
    html: shell(
      "¡Qué semana de aprendizaje! 🏆",
      [
        p(`Hola <b>${familyName}</b>,`),
        p(`Durante la prueba gratis vimos un avance real: <b>${kidHighlights}</b>. ¡Eso no pasa en todas las familias!`),
        p(
          `Para apoyar ese interés, te regalamos un <b>15% de descuento</b> en el plan anual, con el código personal <b>${code}</b> (válido por 30 días, 1 uso).`,
        ),
        button(promoUrl, "Usar mi 15% de descuento"),
        p(`Su progreso queda guardado hasta el <b>${fmtDate(retentionDate)}</b> — al suscribirte lo retoman intacto.`),
      ].join(""),
      marketingFooter(unsubscribeUrl),
    ),
  };
}

/* ── Dunning familiar: problema con el pago (cada 2 días ×15, retención 30 días) ── */
export function dunningFamilyEmail(args: {
  familyName: string;
  retentionDate: Date;
  billingUrl: string;
}): { subject: string; html: string } {
  const { familyName, retentionDate, billingUrl } = args;
  return {
    subject: "⚠️ Problema con el pago de tu suscripción IdiomaConnect",
    html: shell(
      "No pudimos procesar tu pago",
      [
        p(`Hola <b>${familyName}</b>,`),
        p(
          "El último cobro de tu suscripción no pudo procesarse (tarjeta vencida, sin fondos o rechazada por el banco). Tus niños podrían perder el acceso a sus lecciones.",
        ),
        p(
          `🗓 <b>Tranquilidad:</b> el progreso de tus niños queda guardado hasta el <b>${fmtDate(retentionDate)}</b> mientras regularizas el pago. Pasada esa fecha, la cuenta y sus datos se eliminan definitivamente.`,
        ),
        button(billingUrl, "Actualizar método de pago"),
        p("Si ya pagaste, ignora este aviso — el sistema se actualiza en minutos."),
      ].join(""),
      billingFooter,
    ),
  };
}

/* ── Dunning colegios: problema con el pago institucional (cada 2 días ×30, retención 180 días) ── */
export function dunningSchoolEmail(args: {
  schoolName: string;
  retentionDate: Date;
  contactEmail: string;
}): { subject: string; html: string } {
  const { schoolName, retentionDate, contactEmail } = args;
  return {
    subject: `⚠️ ${schoolName}: pago de IdiomaConnect pendiente`,
    html: shell(
      "Pago institucional pendiente",
      [
        p(`Estimado equipo de <b>${schoolName}</b>,`),
        p(
          "Registramos un problema con el pago del servicio IdiomaConnect de su institución. Para no interrumpir el aprendizaje de sus alumnos, les pedimos regularizarlo.",
        ),
        p(
          `🗓 Los datos de la institución — cursos, alumnos y todo su progreso — se conservan hasta el <b>${fmtDate(retentionDate)}</b>. Después de esa fecha se eliminan definitivamente.`,
        ),
        p(`Para coordinar el pago o resolver dudas, responda este correo o escríbanos a <b>${contactEmail}</b>.`),
      ].join(""),
      billingFooter,
    ),
  };
}
