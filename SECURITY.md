# 🔒 Auditoría de Seguridad — IdiomaConnect

> **Fecha:** 2026-06-04 · **Alcance:** app completa (auth, datos, pagos, infra, COPPA).
> **Contexto regulatorio:** maneja datos de **menores** y contexto familiar → COPPA (EE.UU.)
> y **Ley 21.719** (Chile, vigente dic-2026). La protección de datos no es opcional.

Este documento se actualiza cuando cambia la postura de seguridad.

---

## Resumen ejecutivo

La arquitectura base es **sólida**: el aislamiento entre familias está bien resuelto con
Row-Level Security en Postgres, los pagos verifican firma, y la llave de servicio nunca se
expone al cliente. Se corrigieron 5 debilidades de defensa-en-profundidad. Quedan tareas
que **requieren tu intervención** (configuración de servicios externos y firmas legales)
antes de cobrar el primer dólar real.

| Severidad | Hallazgos abiertos |
|---|---|
| 🔴 Alta | 0 en código · (residual: advisories de Next 14.x → plan Next 15) |
| 🟠 Media | Rate-limit en memoria · bucket de avatares público |
| 🟡 Config/Legal | Auth settings, DPA, clave de padres fuerte, CRON_SECRET |

---

## ✅ Lo que YA está bien (no tocar, está correcto)

1. **Aislamiento multi-tenant (RLS).** Todas las tablas tienen Row-Level Security activado,
   con políticas scoped por familia vía `current_family_id()`. Esa función es
   `security definer` con `search_path` fijo → previene inyección de search_path. Una
   familia **no puede** leer datos de otra ni con un bug del frontend.
2. **Storage scoped.** El bucket `avatars` solo permite escritura/borrado dentro de la
   carpeta `<family_id>/` de cada familia.
3. **Webhooks firmados.** El webhook de Lemon Squeezy valida HMAC-SHA256 con
   `timingSafeEqual` (comparación en tiempo constante). Rechaza payloads forjados.
4. **Llave de servicio (service_role) solo en el servidor.** Ningún componente `"use client"`
   la importa. Verificado.
5. **Borrado de cuenta (derecho al olvido).** Requiere sesión + confirmación explícita +
   cascada completa en la DB.
6. **Sin XSS por `dangerouslySetInnerHTML`.** El Markdown se renderiza con `react-markdown`
   (no renderiza HTML crudo por defecto).
7. **Logs sin PII.** El logger tiene `redact()` que scrubea `email`, `password`, `token`, etc.
8. **Validación de entrada.** Los endpoints usan `zod` para validar el body.
9. **`.env.local` protegido** por `.gitignore` (no se sube al repo).
10. **Sin secretos hardcodeados** en el código fuente.

---

## 🔧 Corregido en esta auditoría (ya implementado)

1. **Cabeceras de seguridad HTTP** (`next.config.mjs`). Se agregaron HSTS, `X-Frame-Options:
   DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
   `Permissions-Policy` (micrófono permitido para pronunciación; cámara/geo/pagos bloqueados),
   una CSP mínima segura, y se ocultó `X-Powered-By`.
2. **Cron a prueba de falsificación** (`api/cron/weekly-report`). Antes confiaba en el header
   `x-vercel-cron`, que **cualquiera puede falsificar** para disparar envíos de email. Ahora
   exige el `CRON_SECRET` por `Authorization: Bearer` (que Vercel añade solo) y **falla cerrado**.
3. **Borrado de cuenta ahora purga el Storage** (`api/account/delete`). Antes los **avatares
   subidos** (posibles fotos de niños) quedaban tras eliminar la cuenta — gap COPPA. Ahora se
   borran las imágenes de la familia antes de eliminar al usuario.
4. **Clave del dashboard de padres endurecida** (`lib/parent-auth.ts`). Comparación en tiempo
   constante y **falla cerrado en producción** (sin clave configurada, nadie entra; antes caía
   a la clave por defecto conocida `padres1234`).
5. **Next.js parcheado** `14.2.15 → 14.2.35`. Resolvió la vulnerabilidad **crítica** del
   `npm audit` (bajó a "high" residual).

---

## 🟡 Requiere TU intervención (proceso a seguir)

### A. Configuración de Supabase Auth — ✅ COMPLETADO (2026-06-04)
En **Authentication → Sign In / Providers → Email** + **URL Configuration**:
- [x] **Confirmación de email** activa (verificado: `mailer_autoconfirm = false`).
- [x] **Mínimo de contraseña** subido a **10** caracteres.
- [x] **"Require current password when updating"** activado (bonus).
- [x] **"Secure email change"** activado.
- [x] **URL Configuration**: Site URL + redirect URLs de localhost configurados.
- [ ] **"Leaked password protection"** — diferido: requiere plan **Pro**. Activar antes del
      lanzamiento público.
- [ ] **SMTP propio** — pendiente (opcional): el SMTP gratuito de Supabase tiene rate-limit
      bajo y puede demorar/filtrar emails de verificación. Configurar antes del lanzamiento.
- [ ] Al desplegar: agregar el dominio de Vercel a Site URL + Redirect URLs.

### B. Secretos de producción (al desplegar)
- [ ] `PARENT_DASHBOARD_PASSWORD`: poner una clave fuerte (NO `padres1234`).
- [ ] `CRON_SECRET`: generar un string aleatorio largo (ej. `openssl rand -hex 32`).
- [ ] Rotar las llaves de desarrollo antes de producción (Supabase, Groq).
- [ ] En Vercel, cargar todas las env vars como **secrets**, no en texto plano en el repo.

### C. Compliance legal (antes de cobrar)
- [ ] Firmar **DPA con Groq** (https://groq.com/legal) y **OpenAI** (portal de OpenAI).
- [ ] Revisión legal **Ley 21.719** por abogado en Chile.
- [ ] Confirmar que el flujo de **consentimiento parental** quede registrado con timestamp
      (ya existe en `families.parental_consent_at`).

### D. Bucket de avatares — decisión de privacidad
Hoy el bucket `avatars` es **público** (cualquiera con la URL ve la imagen). Para una app de
niños, si los padres suben fotos reales, conviene hacerlo **privado** con URLs firmadas de
corta duración. Es un cambio de diseño (servir avatares vía signed URLs). **Recomendado antes
del lanzamiento público.** Avísame y lo implemento.

---

## 🟠 Pendientes técnicos (hardening pre-lanzamiento, no bloquean beta)

1. **Rate-limit en memoria → Upstash Redis.** El limitador actual (`lib/rate-limit.ts`) vive en
   memoria; en serverless (Vercel) cada instancia tiene la suya y se reinicia en cada cold
   start → un atacante puede evadirlo y disparar costos de IA. Migrar a Upstash Redis
   (cross-region). Requiere crear cuenta Upstash (gratis hasta cierto volumen).
2. **Upgrade a Next 15.** Next 14.2.x está en mantenimiento y arrastra advisories que solo se
   cierran en 15/16. La mayoría requieren features que esta app **no usa** (i18n Pages Router,
   CSP nonces, beforeInteractive, WebSocket upgrades), por eso no es urgente — pero conviene
   planificar el upgrade antes del lanzamiento masivo.
3. ~~**Tipos de Supabase rotos → bloquea `npm run build`.**~~ ✅ **RESUELTO (2026-06-04).**
   Se fijó `@supabase/supabase-js` a `2.45.4` (exacto), se eliminó código muerto de Stripe
   (`lib/stripe/client.ts`) y se corrigió `favicon.ico/route.ts` (status 204 sin cuerpo).
   **`npm run build` ahora completa** → la app es desplegable a Vercel.
   ⚠️ **No subir `@supabase/supabase-js` sin regenerar `database.types.ts`** con
   `npm run db:types`, o las consultas volverán a romperse (`never`).

---

## Notas

- **CSRF:** riesgo bajo. Las cookies de Supabase usan `SameSite=Lax` y los endpoints esperan
  `Content-Type: application/json` (no enviable por un form cross-site sin preflight CORS).
- **Audio de niños:** no se persiste (solo transcript en tiempo real) — correcto por diseño.
- Re-ejecuta `npm audit --omit=dev` periódicamente para vigilar nuevas vulnerabilidades.
