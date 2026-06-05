# IdiomaConnect

> Inglés gamificado para chicos de 8-14 años. El tutor que conoce a tu familia.
> Stack: **Next.js 14 · Supabase · Groq · Stripe · Vercel**.

---

## Estado actual del proyecto (F0 + F1 entregadas)

### F0 — Foundation
✅ Decisiones de arquitectura congeladas en [`ARCHITECTURE.md`](./ARCHITECTURE.md).
✅ Scaffolding Next.js 14 + TS + Tailwind + design system HUD.
✅ Schema Supabase con RLS multi-tenant familiar.
✅ Migración de prompts, catálogos y lógica pedagógica desde Streamlit.
✅ Stripe Checkout + Webhooks + paywall.
✅ Compliance: consentimiento parental, borrado total de cuenta.

### F1 — Pedagogía mínima
✅ **Renderer Markdown** del cuerpo de la lección (headings, listas, negritas con glow).
✅ **Battle Mode** — vocab combat con HP bars, timer por ronda, distractor plausibles.
✅ **Pronunciation Mode** — grabación con `MediaRecorder` → Whisper → score por similitud.
✅ **Flashcards** — flip cards, auto-add a SRS las que no supo.
✅ **SRS Review** — cola de cards "due hoy", algoritmo SM-2 completo.
✅ **Profile Detail** — hero card, stats, skill breakdown, grid de trofeos.
✅ **Parent Dashboard** — gateado por password familiar.
✅ **Arena** — leaderboard semanal familiar, challenge banner.
✅ **Mode Hub** (`/play`) — el kid elige modalidad después de elegir mundo.
✅ **Add-another-kid** + **Edit profile** (con archive).
✅ **Account settings** + **Delete account** (UI conectada al endpoint COPPA).
✅ **Weekly cron** — reporte por Resend cada viernes (Vercel Cron en `vercel.json`).
✅ **PWA manifest** + apple-web-app config.
✅ Script `npm run copy-avatars` para mover los PNGs originales a `/public/avatars/`.

### F2 — Modos avanzados + hardening
✅ **Conversation Mode** (multi-turn role-play) con 5 escenarios (café, aeropuerto, escuela, médico, hotel) y coach summary final.
✅ **Sentence Builder** (drag-tiles, autocheck).
✅ **Story Fill** (cloze adaptado a CEFR).
✅ **Cápsula cultural diaria** visible en `/profiles` (idiom + canción + dato).
✅ **Avatar upload** a Supabase Storage (`avatars` bucket).
✅ **Rate limiting** server-side (60 llm-gen/día, 80 whisper/h, 40 tts/h, 25 chat/min).
✅ **Cost dashboard** en `/parent` — costo por proveedor de los últimos 30 días.
✅ **Páginas de error** — `error.tsx`, `not-found.tsx`, `loading.tsx`.
✅ **Reset password flow** completo (request + confirm).
✅ **Tests unitarios** con Vitest sobre pedagogy/ y content/ (28 tests).

### F3 — Suite pedagógica completa + producción
✅ **Los 8 modos restantes** activos: Speaking Journal, Translate Inverse, Describe Scene, Exam CEFR diagnóstico, Minimal Pairs, Listen ID, Shadow Speaking, Memory Match. **Total: 15 modos jugables**.
✅ **Generador genérico** de eval de producción (`writing-eval.ts`) reusado por Speaking Journal, Translate Inverse y Describe Scene.
✅ **Componente `<EvalResult>`** reusable para mostrar scoring de producción libre con feedback + versión corregida + highlight phrase.
✅ **Helper `playTTS()`** del lado del cliente con cache por sesión (evita re-pagar tokens si se repite un audio).
✅ **Landing comercial completa** con storytelling: hero + problema vs nosotros + 3 pasos + grilla de 16 modos + diferenciadores + pricing + FAQ + CTA final.
✅ **Service Worker** (`/public/sw.js`) con precache del shell, cache-first para `/_next/static`, `/avatars`, fuentes, e imágenes de Supabase Storage; network-first con fallback `/offline` para navigation.
✅ **Página `/offline`** con mensaje útil.
✅ **`<ServiceWorkerRegister>`** lazy en `<body>` del layout (solo en prod).
✅ **Logger estructurado** (`src/lib/logging/logger.ts`) que emite JSON-per-line en prod, scrubea PII y forward errores a Sentry si DSN está configurado.
✅ **Sentry stubs** (`sentry.client.config.ts` + `sentry.server.config.ts`) — listos para `npm i @sentry/nextjs` cuando quieras observabilidad real.

### F4 (próximo)
🔧 Pronunciation con phonemizer (microservicio Python en Railway) para mejorar accuracy.
🔧 Upstash Redis para rate limit cross-region.
🔧 Soporte multi-idioma (UI en inglés además de español).
🔧 Apple/Google OAuth en signup.
🔧 Modo "Profesor" (B2B para colegios).
🔧 Push notifications de "tu repaso SRS está listo".

---

## Quick start (Windows / PowerShell)

```powershell
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
copy .env.example .env.local
# Editar .env.local con tus claves

# 3. Aplicar migraciones a Supabase
# Ver supabase/README.md — pegar los .sql en el SQL Editor, o:
npx supabase link --project-ref <tu-ref>
npx supabase db push

# 4. (Opcional) Copiar avatares originales al /public
npm run copy-avatars

# 5. Dev
npm run dev
# → http://localhost:3000
```

---

## Configuración paso a paso

### A. Supabase (5 minutos)

1. Crear proyecto en https://supabase.com/dashboard
2. **Settings → API** → copiar `URL`, `anon key`, `service_role key` a `.env.local`
3. **SQL Editor** → pegar y ejecutar:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
4. **Authentication → Providers** → habilitar Email
5. **Authentication → URL Configuration** → agregar tu URL de Vercel a "Redirect URLs"

### B. Groq (2 minutos)

1. Crear API key en https://console.groq.com/keys
2. Copiar a `GROQ_API_KEY` en `.env.local`
3. Modelos usados: `llama-3.3-70b-versatile` y `whisper-large-v3` (no requieren setup)

### C. OpenAI (2 minutos)

Solo para TTS (síntesis de voz).

1. Crear API key en https://platform.openai.com/api-keys
2. Copiar a `OPENAI_API_KEY` en `.env.local`
3. Modelo: `tts-1` (~$15 USD por millón de caracteres)

### D. Lemon Squeezy (15 minutos)

> Stripe no opera con cuentas chilenas. Usamos LS como Merchant of Record:
> ellos cobran globalmente, manejan VAT/IVA en 100+ países y te depositan en
> tu cuenta bancaria chilena o PayPal.

1. Crear cuenta + Store en https://www.lemonsqueezy.com (Country = Chile, Currency = USD)
2. **Store → Products → New product** → tipo **Subscription**:
   - Variant 1: `Monthly` · $9.99 USD/mes · 7 días trial
   - Variant 2: `Yearly` · $79 USD/año · 7 días trial
3. Anotar y poner en `.env.local`:
   - **API Key** (Settings → API) → `LEMONSQUEEZY_API_KEY`
   - **Store ID** (de la URL del store) → `LEMONSQUEEZY_STORE_ID`
   - **Variant ID Monthly** (de la URL del variant) → `NEXT_PUBLIC_LS_VARIANT_MONTHLY`
   - **Variant ID Yearly** → `NEXT_PUBLIC_LS_VARIANT_YEARLY`
4. **Settings → Webhooks → + Add endpoint**:
   - URL: `https://tudominio.com/api/payments/webhook`
   - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_payment_success`, `subscription_payment_failed`
   - Copiar signing secret → `LEMONSQUEEZY_WEBHOOK_SECRET`

### E. Resend (opcional, para emails)

1. Crear cuenta en https://resend.com
2. Verificar dominio
3. API key → `RESEND_API_KEY`

### F. Vercel (deploy)

1. Importar repo en https://vercel.com/new
2. Agregar todas las variables de `.env.local` en Environment Variables
3. Deploy

---

## Estructura del proyecto

```
.
├── ARCHITECTURE.md          ← decisiones técnicas
├── README.md                ← este archivo
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
├── .env.example
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql    ← schema (familias, kids, sessions, srs, trofeos)
│   │   └── 0002_rls.sql     ← Row-Level Security multi-tenant
│   └── README.md
├── public/
│   └── avatars/             ← PNGs reales (mover desde /Avatars/)
└── src/
    ├── middleware.ts        ← auth gate
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css      ← design system HUD
    │   ├── page.tsx         ← landing
    │   ├── login/  signup/  auth/callback/
    │   ├── onboarding/      ← 4 pasos: kid + familia + consentimiento
    │   ├── onboarding/kid/  ← agregar otro kid
    │   ├── profiles/        ← selector multi-kid
    │   ├── profile/[kidId]/ ← detail: stats, skills, trofeos
    │   ├── profile/[kidId]/edit/
    │   ├── worlds/          ← mapa de mundos
    │   ├── play/            ← hub de modalidades por mundo
    │   ├── lesson/          ← lección clásica + quiz + TTS
    │   ├── battle/          ← Battle Mode (HP bars + timer)
    │   ├── pronunciation/   ← grabación + Whisper + score
    │   ├── flashcards/      ← flip cards + auto-add SRS
    │   ├── srs/             ← repaso (SM-2)
    │   ├── conversation/    ← role-play multi-turn
    │   ├── sentence-builder/ ← drag-tiles
    │   ├── story-fill/      ← cloze
    │   ├── speaking-journal/ ← 30-60s libre + LLM eval
    │   ├── exam/            ← placement CEFR
    │   ├── shadow-speaking/ ← TTS + repeat + score
    │   ├── translate-inverse/ ← ES→EN typing
    │   ├── describe-scene/  ← describe escena en EN
    │   ├── minimal-pairs/   ← TTS + a/b
    │   ├── listen-id/       ← TTS + pick meaning
    │   ├── memory-match/    ← concentration vocab
    │   ├── arena/           ← leaderboard familiar
    │   ├── parent/          ← dashboard padres + costos
    │   ├── billing/         ← LS checkout
    │   ├── account/settings/
    │   ├── reset-password/  ← request + confirm
    │   ├── privacy/ terms/ offline/
    │   ├── error.tsx not-found.tsx loading.tsx
    │   └── api/
    │       ├── lessons/generate/
    │       ├── quiz/evaluate/
    │       ├── xp/save/
    │       ├── battle/generate/
    │       ├── pronunciation/words/ score/
    │       ├── flashcards/generate/
    │       ├── srs/add/ due/ review/
    │       ├── conversation/chat/ summary/
    │       ├── sentence-builder/generate/
    │       ├── story-fill/generate/
    │       ├── avatar/upload/        ← Supabase Storage
    │       ├── audio/transcribe/ tts/
    │       ├── payments/checkout/ webhook/   ← Lemon Squeezy
    │       ├── stripe/checkout/ webhook/      ← deprecated (410 Gone)
    │       ├── parent/summary/ usage/  ← incluye cost dashboard
    │       ├── cron/weekly-report/   ← Vercel Cron viernes 18 UTC
    │       └── account/delete/       ← GDPR/COPPA
    ├── components/
    │   ├── ui/              ← GlassCard, NeonButton, ProgressBar, Avatar, BottomNav
    │   └── lesson/
    │       └── LessonRunner.tsx
    └── lib/
        ├── utils.ts
        ├── supabase/        ← client/server/middleware/types
        ├── groq/            ← client/prompts/lesson/transcribe
        ├── tts/             ← provider abstraction
        ├── stripe/
        ├── content/         ← cefr, worlds, trofeos, cultural, modes
        └── pedagogy/        ← evaluate-quiz, pronunciation, srs, stats
```

---

## Modelo de negocio

| Plan | Precio | Incluye |
|---|---|---|
| **Trial** | $0 · 7 días | 1 kid profile, 5 lecciones, todas las features |
| **Family Monthly** | $9.99 USD/mes | Hasta 6 kids, todas las features |
| **Family Yearly** | $79 USD/año | Hasta 6 kids · ahorras 34% |

---

## Privacy & Compliance

Antes de cobrar el primer dólar real:

- [x] Política de Privacidad (`/privacy`)
- [x] Términos de Servicio (`/terms`)
- [x] Consentimiento parental en signup
- [x] Endpoint de borrado total (`/api/account/delete`)
- [x] Audio no se persiste (solo se transcribe en tiempo real)
- [ ] DPA firmado con Groq (descargar de https://groq.com/legal)
- [ ] DPA firmado con OpenAI (descargar de https://openai.com/policies)
- [ ] Revisión legal por abogado en Chile (Ley 21.719 vigente desde dic-2026)

---

## Comandos útiles

```powershell
npm run dev          # desarrollo local
npm run build        # build de producción
npm run start        # servir build
npm run typecheck    # verificar tipos sin emit
npm run lint         # ESLint
npm run test         # tests unitarios (vitest)
npm run test:watch   # tests en watch mode
npm run copy-avatars # mover /Avatars/*.png a /public/avatars/
npm run db:types     # regenerar database.types.ts desde Supabase
```

---

## Costos operativos estimados (100 familias activas)

| Servicio | Costo / mes |
|---|---|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Groq (lecciones + Whisper) | ~$30 (5 lecciones/familia/día) |
| OpenAI TTS | ~$15 |
| Resend | $0 (free tier hasta 3k) |
| Lemon Squeezy | 5% + $0.50 por transacción (MoR — incluye VAT/IVA) |
| **Total** | **~$90/mes** |

Con 100 familias × $9.99 = **$999 ingresos brutos**. Margen bruto ~85% después del fee de Lemon Squeezy (que incluye procesamiento de pago, IVA global y compliance — vs ~88% si fuera Stripe + tú haciendo tu propia contabilidad de IVA en 50 países).

---

## Próximos pasos

Ver detalle en [`ARCHITECTURE.md → Roadmap de migración`](./ARCHITECTURE.md#6-roadmap-de-migración).

1. **F1 — Pedagogía mínima:** ya está la lección clásica + quiz end-to-end. Falta hookear el primer kid de prueba.
2. **F2 — 5 modos clave:** Pronunciation (record + score), Conversation (multi-turn role-play), Flashcards (flip cards), SRS (review queue), Battle Mode (HP bars).
3. **F3 — Onboarding completo:** ya hecho. Falta polish UX y soporte para "Editar perfil" después de creado.
4. **F4 — Polish + Privacy:** completar DPA, beta cerrada con 10 familias.
5. **F5 — Beta cerrada:** feedback loop.
6. **F6 — Launch público:** landing page de marketing, Product Hunt, ASO.

---

## Crédito

Construido sobre el MVP Streamlit original (`main (3).py`, 10.914 líneas) de Juan Carlos Cubillos.
Migración técnica + dirección de proyecto: Claude Sonnet (modo gerente).
