# Deploy a producción — Checklist real

Esta guía te lleva de `git clone` a una URL pública con tu primera familia beta. Tiempo realista: **2 horas** si nunca configuraste estos servicios; **45 minutos** si ya tienes cuentas.

---

## 0. Pre-requisitos

- Node 20+ (`node --version`)
- npm 10+ (viene con Node)
- Cuenta GitHub
- Una cuenta bancaria chilena o PayPal (para que Lemon Squeezy te deposite ingresos)

---

## 1. Setup local (10 min)

```powershell
# Clonar / copiar el proyecto
cd "C:\Users\Pc01\Documents\jc_varios\IdiomeConnect app comercial"

# Instalar deps
npm install

# Copiar variables de entorno
copy .env.example .env.local

# Copiar avatares originales al public/
npm run copy-avatars

# Verificar que el typecheck pasa
npm run typecheck

# Verificar que los tests pasan
npm test
```

Si typecheck o tests fallan acá, **detente y reporta antes de seguir**.

---

## 2. Supabase (20 min)

### 2.1. Crear proyecto

1. Ir a https://supabase.com/dashboard → **New project**
2. Nombre: `idiomaconnect-prod`
3. Database password: usa un gestor de contraseñas, guárdala
4. Región: la más cercana a tus usuarios (ej: `us-east-1` para Chile)
5. Plan: **Free** está bien hasta 50K MAU. Sube a Pro ($25/mes) antes de lanzar público.

### 2.2. Aplicar migraciones

En el **SQL Editor** del dashboard, ejecuta en orden:

1. `supabase/migrations/0001_init.sql` — schema completo
2. `supabase/migrations/0002_rls.sql` — políticas Row-Level Security
3. `supabase/migrations/0003_fix_usage_and_storage.sql` — fixes + bucket de avatares

> ⚠️ **Si saltas la 0003, los avatares no se podrán subir y los `usage_events` fallarán silenciosamente.**

### 2.3. Configurar Auth

**Authentication → Providers**:
- ✅ Email habilitado
- ✅ "Confirm email" habilitado (recomendado)
- ✅ "Secure email change" habilitado

**Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (para dev) → cambia a tu dominio Vercel después
- Redirect URLs: agregar
  - `http://localhost:3000/auth/callback`
  - `https://tu-dominio.vercel.app/auth/callback`
  - `https://tu-dominio-custom.com/auth/callback` (si tienes uno)

### 2.4. Copiar credenciales a `.env.local`

**Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` `public` key
- `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key (⚠️ NUNCA expongas esto al cliente)
- `SUPABASE_PROJECT_REF` = el slug del proyecto (visible en la URL)

### 2.5. Verificar

Desde el SQL Editor:
```sql
select count(*) from families;
select count(*) from kid_profiles;
-- Ambas deberían retornar 0 sin errores
```

Y desde Storage:
- Buckets → debes ver `avatars` con `public = true`

---

## 3. Groq (5 min)

1. Ir a https://console.groq.com → registrarte (Github OAuth funciona)
2. **API Keys → Create API Key**
3. Copiar a `.env.local` como `GROQ_API_KEY`

Los modelos `llama-3.3-70b-versatile` y `whisper-large-v3` están en el free tier por ahora. Si los precios cambian, ajusta el costo estimado en `/api/lessons/generate` (línea ~125).

---

## 4. OpenAI (5 min)

Solo para TTS. Whisper lo hace Groq.

1. Ir a https://platform.openai.com/api-keys
2. **Create new secret key** (sin restricción de IP por ahora)
3. Copiar a `OPENAI_API_KEY`
4. Cargar **al menos $5 USD** en billing — el tier 1 cuesta ~$0.015 USD por 1K caracteres de TTS

> 💡 Pon un límite de gasto mensual ($50 USD) en Settings → Limits hasta que sepas tu consumo real.

---

## 5. Lemon Squeezy — Pagos (20 min)

> **Por qué Lemon Squeezy y no Stripe:** Stripe no acepta cuentas comerciales con
> domicilio fiscal en Chile (lo prometen hace años, no llega). Lemon Squeezy es
> Merchant of Record: ellos cobran globalmente, manejan VAT/IVA en cada país, y te
> depositan en tu cuenta chilena o PayPal. Fee total ~5% + $0.50 por transacción.

### 5.1. Crear cuenta y Store

1. Crear cuenta en https://www.lemonsqueezy.com → **Sign up free**
2. Crear tu primer Store:
   - **Store name**: `IdiomaConnect`
   - **Country**: Chile (sí está disponible)
   - **Default currency**: USD
   - **Industry**: Education / EdTech
3. **Settings → Tax info**: completar con RUT + nombre legal + dirección
4. **Settings → Payouts**: conectar cuenta bancaria chilena o PayPal (LS paga mensual cuando acumulas ≥$10 USD)

### 5.2. Crear el producto + 2 variants

1. **Store → Products → New product**
2. Llenar:
   - **Name**: `IdiomaConnect Family Plan`
   - **Description**: `Hasta 6 perfiles familiares · todas las features pedagógicas`
   - **Status**: Published
   - **Type**: **Subscription**
3. Primer variant:
   - **Variant name**: `Monthly`
   - **Price**: `$9.99 USD`
   - **Billing period**: Every 1 month
   - **Free trial**: 7 days
4. Click **Add variant** → segundo:
   - **Variant name**: `Yearly`
   - **Price**: `$79.00 USD`
   - **Billing period**: Every 1 year
   - **Free trial**: 7 days
5. Save product

### 5.3. Anotar los 5 valores para `.env.local`

| `.env.local` var | Dónde encontrar el valor |
|---|---|
| `LEMONSQUEEZY_API_KEY` | Settings → API → Create API key → nombre `idiomaconnect-prod`, copiar el `eyJ...` |
| `LEMONSQUEEZY_STORE_ID` | URL del store: `https://app.lemonsqueezy.com/store/12345` → `12345` es el ID |
| `NEXT_PUBLIC_LS_VARIANT_MONTHLY` | Click el variant "Monthly" en la página del producto → URL: `/variants/67890` |
| `NEXT_PUBLIC_LS_VARIANT_YEARLY` | Igual con el variant "Yearly" |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Se crea en el paso 5.4 |

### 5.4. Webhook

1. **Settings → Webhooks → + Add endpoint**
2. **Callback URL**:
   - Para dev local: `http://localhost:3000/api/payments/webhook`
   - Para producción: `https://tu-dominio.vercel.app/api/payments/webhook`
3. **Signing secret**: LS te muestra uno → **cópialo** a `LEMONSQUEEZY_WEBHOOK_SECRET`
4. **Events to send** — marcar:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_payment_success`
   - `subscription_payment_failed`
5. Save

### 5.5. Modo Test vs Live

Lemon Squeezy **no separa entornos** como Stripe. Mientras tu store está en **Test mode** (toggle en sidebar), las transacciones usan tarjetas de prueba (`4242 4242 4242 4242`).

Cuando estés listo para cobrar real:
1. **Settings → Store → Verify business** (completa el form de KYC, demora 1-3 días)
2. **Sidebar → Test mode** → apagar
3. Las mismas variant IDs y API key sirven en producción.

---

## 6. Resend (5 min, opcional para reportes semanales)

1. Crear cuenta en https://resend.com
2. **Domains → Add domain** — agrega tu dominio (o usa `resend.dev` para probar)
3. Configurar los registros DNS que te da (SPF + DKIM)
4. **API Keys → Create**
5. Copiar a `RESEND_API_KEY`
6. Setear `RESEND_FROM_EMAIL=hola@tudominio.com`

Si no haces esto, los reportes semanales fallarán silenciosamente, pero todo lo demás funciona.

---

## 7. Sentry (5 min, opcional pero MUY recomendado)

1. Crear cuenta en https://sentry.io
2. **Create Project → Next.js**
3. Copiar el DSN (público)
4. Setear ambos en `.env.local`:
   - `NEXT_PUBLIC_SENTRY_DSN=...`
   - `SENTRY_DSN=...` (mismo valor está bien)
5. Instalar el SDK:
   ```powershell
   npm install @sentry/nextjs
   ```

Sin el DSN, los archivos `sentry.*.config.ts` son no-ops. Con DSN, capturan errores automáticamente.

---

## 8. Probar local (10 min)

```powershell
npm run dev
# → http://localhost:3000
```

### Smoke test manual obligatorio antes de deployar

- [ ] `/` carga la landing
- [ ] `/signup` → crear cuenta con email real (te llegará un email de verificación)
- [ ] Verificar email, vuelves a `/profiles`
- [ ] `/onboarding` se carga, completar los 4 pasos (incluir 2-3 family members)
- [ ] Llegar a `/worlds?kid=...`
- [ ] Probar **al menos** estos 3 modos:
  - [ ] Lección clásica (verifica que Groq genera el JSON correcto)
  - [ ] Pronunciation (verifica permiso de micrófono + Whisper)
  - [ ] Battle Mode (verifica generación rápida)
- [ ] `/profile/[kidId]` muestra stats + trofeos
- [ ] `/parent` con el password `padres1234` (default) — verifica que aparezca el cost dashboard
- [ ] `/billing` → click checkout → completar con tarjeta de prueba `4242 4242 4242 4242`
- [ ] Volver a la app: tu `families.plan` debería estar `family_monthly` (verifica en Supabase)
- [ ] `/account/settings` → "Eliminar cuenta" → confirmar con "BORRAR" → todo se debe borrar

Si **cualquiera** de estos falla, **no deployes**. Repórtalo.

### Verificar el healthcheck

```powershell
curl http://localhost:3000/api/health
# Esperado: {"status":"ok","checks":{"db":"ok","groq":"ok",...}}
```

---

## 9. Deploy a Vercel (15 min)

### 9.1. Subir a GitHub

```powershell
git init
git add .
git commit -m "Initial commit"
# Crear repo privado en GitHub primero, luego:
git remote add origin git@github.com:tu-usuario/idiomaconnect.git
git push -u origin main
```

### 9.2. Importar a Vercel

1. https://vercel.com/new
2. Import tu repo
3. **Framework Preset**: Next.js (auto-detectado)
4. **Environment Variables**: copiar TODAS las del `.env.local` excepto las que empiezan con `NEXT_PUBLIC_` también (ambos sets)
   - ⚠️ Importante: `NEXT_PUBLIC_APP_URL` debe apuntar al dominio de Vercel (`https://tu-proyecto.vercel.app`) o a tu dominio custom
5. Deploy

### 9.3. Post-deploy

- [ ] Volver a Supabase y agregar la URL de Vercel a **Redirect URLs** (Authentication → URL Configuration)
- [ ] Volver a Lemon Squeezy → Settings → Webhooks → editar el endpoint y cambiar a `https://tu-vercel.app/api/payments/webhook`
- [ ] Probar el healthcheck: `https://tu-proyecto.vercel.app/api/health`
- [ ] Probar signup en producción
- [ ] Verificar que el cron de viernes 18:00 UTC está registrado (Vercel → Settings → Cron Jobs)

---

## 10. Lanzamiento beta cerrado (10 min)

1. **Email a las 10 familias del listado de validación** con:
   - Link directo a `https://tu-dominio.com/signup`
   - Discount code de Lemon Squeezy `FAMILIA_BETA` con 50% off el primer mes (créalo en LS → Store → Discounts → New)
   - Pedirles que reporten bugs a `bugs@idiomaconnect.app`
2. **Configurar UptimeRobot** apuntando a `https://tu-dominio.com/api/health` cada 5 minutos
3. **Monitor Sentry** los primeros días por errores no anticipados
4. **Monitor Supabase → Reports** por queries lentas o RLS denegando algo que no debería

---

## Troubleshooting común

| Síntoma | Causa probable | Fix |
|---|---|---|
| Signup OK pero el usuario aparece sin `families` row | Trigger `handle_new_user` no se creó | Re-ejecutar `0001_init.sql` desde el "create trigger" hacia abajo |
| Avatar upload da 403 | Bucket `avatars` no existe o policy mal puesta | Ejecutar `0003_fix_usage_and_storage.sql` |
| `usage_events` no acumula filas | Política INSERT faltante en RLS | Ejecutar `0003_fix_usage_and_storage.sql` |
| LS checkout funciona pero la app sigue en trial | Webhook no llegó o signing secret incorrecto | Verificar URL del webhook + ver "Webhook logs" en Lemon Squeezy → Settings → Webhooks |
| Lessons tardan 30s+ | Groq devolvió rate_limit | Ver `usage_events` para confirmar; subir cuota en Groq dashboard |
| TTS no se escucha en iOS | iOS requiere user gesture para audio | El `audio.play().catch()` ya lo maneja, pero la primera vez requiere un click. No reproduzcas TTS automático en mount. |
| Email de verificación no llega | Supabase rate limit en SMTP free tier | Configurar SMTP propio en Settings → Auth → SMTP |

---

## Métricas que importan (revisa semanalmente)

- **DAU / WAU** → consultas a `lesson_sessions` agrupado por día
- **Retention D1, D7, D30** → cuántos kids que se registraron volvieron al día 1, 7, 30
- **Lecciones por kid por semana** → engagement real
- **Costo por kid por mes** → `usage_events` agrupado por `family_id`, dividido por kids activos
- **LS MRR** → tu número del norte (Lemon Squeezy → Dashboard → MRR)

Si DAU/WAU < 30%, hay un problema de engagement, no de adquisición. Vuelve a entrevistar familias antes de pagar ads.

---

## Si todo se rompe

1. `git revert HEAD && git push` → vuelve atrás
2. Vercel auto-redeploya
3. Si los datos están corruptos: Supabase tiene backups diarios en el plan Pro
4. Si Lemon Squeezy se descalibró: Settings → Webhooks → click el endpoint → "Resend" en cualquier evento fallido

**No entres en pánico.** Esto es web, no aviónica.
