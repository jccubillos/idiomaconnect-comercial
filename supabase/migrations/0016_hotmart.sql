-- ============================================================
-- Migration 0016 — Fulfillment de afiliados (Hotmart)
--
-- Los paquetes de afiliado son PAGO ÚNICO con acceso temporal:
--   · English Fast Starter  → acceso base, 6 meses
--   · English Pro Family 12 → acceso Plus, 12 meses
--   · English Lifetime      → acceso Plus, de por vida
--
-- · families.plan_expires_at : vencimiento de planes pagados temporales.
-- · hotmart_entitlements     : compras de Hotmart pendientes de "reclamar"
--   (el comprador llega SIN cuenta; al registrarse con ese correo, se aplica).
-- · hotmart_events           : idempotencia (Hotmart reintenta webhooks).
-- ============================================================

-- 1. Vencimiento de planes pagados temporales (null = sin vencimiento).
alter table public.families
  add column if not exists plan_expires_at timestamptz;

-- 2. Compras de Hotmart por correo (se aplican al crear/entrar la cuenta).
create table if not exists public.hotmart_entitlements (
    id              uuid primary key default gen_random_uuid(),
    email           text not null,                 -- siempre en minúsculas
    plan            text not null,                 -- 'family_yearly' | 'family_plus' | 'family_lifetime'
    plus            boolean not null default false,
    months          integer,                       -- null = de por vida
    transaction     text,                          -- id de transacción de Hotmart
    status          text not null default 'pending'
                      check (status in ('pending', 'applied', 'refunded')),
    created_at      timestamptz not null default now(),
    applied_at      timestamptz
);

create index if not exists hotmart_entitlements_email_idx on public.hotmart_entitlements(email, status);

alter table public.hotmart_entitlements enable row level security;
-- Sin políticas: solo el servidor (service_role).

-- 3. Idempotencia de webhooks de Hotmart.
create table if not exists public.hotmart_events (
    id          text primary key,                  -- id único del evento de Hotmart
    received_at timestamptz not null default now()
);

alter table public.hotmart_events enable row level security;

-- 4. Código de referido propio de cada familia (programa "regala un mes, gana un mes").
alter table public.families
  add column if not exists referral_code text unique;

-- Quién refirió a quién (para premiar al referente cuando el referido contrata).
alter table public.families
  add column if not exists referred_by text;
