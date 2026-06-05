# IdiomaConnect — Decisiones de Arquitectura (ADR)

> **Fecha:** 2026-05-14
> **Autor:** Project Manager (Claude) — bajo mandato de Juan Carlos Cubillos
> **Estado:** Aprobado · Opción B (SaaS para nicho familiar)

Este documento congela las decisiones técnicas. Cambiarlas requiere actualizar este archivo primero.

---

## 1. Stack final

| Capa | Decisión | Por qué |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Único framework con SSR/CSR/API routes en un mismo deploy. Móvil-first sin reescribir. PWA-ready. |
| **UI primitives** | Componentes propios (sin shadcn) sobre Tailwind | El design HUD es muy específico, los componentes de shadcn estorban más que ayudan. |
| **API** | Next.js Route Handlers (`app/api/*`) | Cero servicios extra. Deploy unificado en Vercel. Suficiente para llamadas a Groq + Supabase. |
| **DB + Auth** | Supabase (Postgres 15 + Auth + RLS + Storage) | Postgres real, Row-Level Security para multi-tenant familiar, $0 hasta 50k MAU. |
| **LLM** | Groq · `llama-3.3-70b-versatile` | Ya validado pedagógicamente en `main (3).py`. Latencia <1s, costo bajísimo. |
| **STT** | Groq · `whisper-large-v3` | Mismo proveedor, una sola API key. |
| **TTS** | OpenAI TTS (`tts-1`) como default, abstraído tras interface | `edge-tts` no tiene SLA. OpenAI TTS cuesta ~$0.015/1k chars, calidad alta. Cambiar provider = 1 archivo. |
| **Pronunciation scoring** | Whisper transcript + Levenshtein (MVP) | `phonemizer + espeak-ng` requiere Python runtime. Para MVP, comparación textual basta. Roadmap: microservicio Python en Railway. |
| **Pagos** | Lemon Squeezy (Merchant of Record + Webhooks) | Stripe no opera en Chile. LS cobra global, maneja VAT/IVA en 100+ países, paga a cuenta bancaria chilena. Fee ~5% + $0.50/tx. |
| **Hosting** | Vercel (frontend + API) + Supabase (DB) | Stack canónico. Deploy = `git push`. |
| **Email** | Resend | API moderna, $0 hasta 3k/mes. Reemplaza el SMTP de Gmail del Streamlit. |
| **Observabilidad** | Vercel Analytics + Supabase logs + Sentry (free tier) | Suficiente para los primeros 1000 usuarios. |

## 2. Arquitectura de datos (multi-tenant)

**Una cuenta de Supabase Auth = un padre/madre = una "familia".**
Cada familia tiene N `kid_profiles` (los niños) y M `family_members` (contexto: tíos, primos, mascotas).

```
auth.users (Supabase)
  └─ families (1:1)
       ├─ kid_profiles (1:N) ── stats, XP, racha, CEFR
       │    ├─ lesson_sessions (1:N)
       │    ├─ srs_cards (1:N)
       │    └─ trophies_earned (1:N)
       └─ family_members (1:N) ── inyectado en prompts
```

**Aislamiento:** Row-Level Security (RLS) en Postgres. Una familia jamás puede leer datos de otra, ni siquiera por bug del frontend.

## 3. Decisiones explícitamente descartadas

| Idea | Por qué NO |
|---|---|
| FastAPI separado | Doble deploy, doble auth, doble CORS. Next API routes alcanzan. |
| Mantener Streamlit | Imposible lograr el HUD del mock. No es PWA. UX inferior en móvil. |
| Google Sheets como DB | Race conditions, 60 req/min, sin transacciones. Bloqueador real. |
| `family_context` hardcoded | No replicable. Riesgo legal (datos familiares en git). |
| shadcn/ui completo | Componentes genéricos chocan con la estética HUD. Solo uso primitivos. |
| Auth0/Clerk | Supabase Auth alcanza, ya viene incluido, una API key menos. |
| React Native nativo (Opción C) | Prematuro. Si la PWA funciona, postergamos 12 meses. |

## 4. Modelo de negocio (locked)

- **Free trial:** 7 días, sin tarjeta, hasta 1 kid profile y 5 lecciones.
- **Family Plan:** USD 9.99/mes ó USD 79/año (-34%). Hasta 6 kid profiles, todas las features.
- **Sin tier "Premium"** en MVP. Una sola SKU = decisión de compra trivial.
- **Provisionalmente sin tier escolar** (B2B viene después de probar B2C).

## 5. Privacidad y compliance (gating de lanzamiento)

Antes de cobrar el primer dólar:
- [ ] Política de privacidad publicada (`/privacy`)
- [ ] Términos de servicio (`/terms`)
- [ ] Consentimiento parental explícito en signup (checkbox + texto)
- [ ] DPA firmado con Groq y OpenAI (formularios disponibles en sus portales)
- [ ] Mecanismo de **borrado de datos** funcional (`DELETE /api/account` que purga todo)
- [ ] Audio de niños no se persiste (transcript sí, audio raw NO)
- [ ] Logs de prompts sin PII (anonimizar nombre del niño → `[KID]`)

## 6. Roadmap de migración

| Fase | Entregable | Tiempo estimado |
|---|---|---|
| **F0 — Foundation** *(ahora)* | Scaffold, design system, schema, prompts portados, login/profile select funcional | 1-2 semanas |
| **F1 — Pedagogía mínima** | Lesson + Quiz + XP save end-to-end con Groq | 2 semanas |
| **F2 — 5 modos clave** | Pronunciation, Conversation, Flashcards, SRS, Battle | 3 semanas |
| **F3 — Onboarding + Lemon Squeezy** | Signup padre, captura contexto familiar, paywall | 1 semana |
| **F4 — Polish + Privacy** | TOS, política, borrado, parent dashboard, reportes | 1 semana |
| **F5 — Beta cerrada** | 10 familias del listado de validación, feedback loop | 2 semanas |
| **F6 — Launch público** | Landing, ASO básico, Product Hunt | 1 semana |

**Total realista:** ~11 semanas con foco. La carpeta `Analisis de desarrollo/` con 5 análisis distintos (Gemini, Grok, Qwen, GLM5, Deepseek) sugiere que el riesgo no es técnico — es la disciplina para no rediseñar a media construcción.
