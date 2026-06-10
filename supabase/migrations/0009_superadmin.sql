-- ============================================================
-- Migration 0009 — Administración de la plataforma (superadmin)
--
-- · app_admins      : quién puede entrar al dashboard /admin (dueño de la app).
--                     Guarda el secreto TOTP (Google Authenticator).
-- · admin_audit     : auditoría de cada acción del administrador.
-- · discount_codes  : registro propio de códigos de descuento (espejo de los
--                     creados en Lemon Squeezy vía API; % y duración a medida).
--
-- Seguridad: las 3 tablas tienen RLS habilitado SIN políticas → ningún cliente
-- (anon o autenticado) puede leerlas/escribirlas. Solo el servidor con
-- service_role (que bypassa RLS) las usa, detrás del guard TOTP.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. APP_ADMINS — administradores de la plataforma + secreto TOTP
-- ────────────────────────────────────────────────────────────
create table if not exists public.app_admins (
    user_id        uuid primary key references auth.users(id) on delete cascade,
    totp_secret    text,                       -- base32; null hasta el primer setup
    totp_verified  boolean not null default false,
    created_at     timestamptz not null default now()
);

alter table public.app_admins enable row level security;
-- Sin políticas: solo service_role.

-- ────────────────────────────────────────────────────────────
-- 2. ADMIN_AUDIT — registro de cada acción del administrador
-- ────────────────────────────────────────────────────────────
create table if not exists public.admin_audit (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    action      text not null,    -- 'totp_setup' | 'totp_login' | 'code_created' | ...
    detail      jsonb,
    created_at  timestamptz not null default now()
);

create index if not exists admin_audit_time_idx on public.admin_audit(created_at desc);

alter table public.admin_audit enable row level security;
-- Sin políticas: solo service_role.

-- ────────────────────────────────────────────────────────────
-- 3. DISCOUNT_CODES — registro de códigos (con espejo en Lemon Squeezy)
-- ────────────────────────────────────────────────────────────
create table if not exists public.discount_codes (
    id               uuid primary key default gen_random_uuid(),
    code             text not null unique,        -- en MAYÚSCULAS
    percent          integer not null check (percent between 1 and 100),
    duration         text not null default 'once'
                       check (duration in ('once', 'repeating', 'forever')),
    duration_months  integer,                     -- solo si duration='repeating'
    max_redemptions  integer not null default 1,  -- 1 = un solo uso
    expires_at       timestamptz,                 -- null = sin vencimiento
    ls_discount_id   text,                        -- id del descuento en Lemon Squeezy
    active           boolean not null default true,
    note             text,                        -- referencia interna (ej. "campaña colegios marzo")
    created_at       timestamptz not null default now()
);

create index if not exists discount_codes_active_idx on public.discount_codes(active, created_at desc);

alter table public.discount_codes enable row level security;
-- Sin políticas: solo service_role.
