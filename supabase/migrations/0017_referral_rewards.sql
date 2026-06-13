-- ============================================================
-- Migration 0017 — Premio del programa de referidos ("gana un mes")
--
-- Cuando una familia REFERIDA contrata un plan pagado (Hotmart o Lemon
-- Squeezy), su REFERENTE gana 30 días gratis. Esta tabla:
--   · da IDEMPOTENCIA (un solo premio por familia referida — unique), y
--   · deja AUDITORÍA de cómo se entregó cada premio.
--
-- La columna families.referral_code (código propio) y families.referred_by
-- (quién lo refirió) ya existen desde la migración 0016.
-- ============================================================

create table if not exists public.referral_rewards (
    id                 uuid primary key default gen_random_uuid(),
    referrer_family_id uuid not null references public.families(id) on delete cascade,
    -- Un solo premio por familia referida (se otorga en su PRIMERA contratación).
    referred_family_id uuid not null unique references public.families(id) on delete cascade,
    referral_code      text not null,
    -- Cómo se entregó el premio al referente:
    --   'extended'       → +30 días a su trial o a su plan temporal (Hotmart).
    --   'pending_credit' → referente con suscripción recurrente o vitalicio:
    --                       crédito por aplicar cuando los pagos estén activos.
    method             text not null default 'extended'
                         check (method in ('extended', 'pending_credit')),
    reward_days        integer not null default 30,
    created_at         timestamptz not null default now()
);

create index if not exists referral_rewards_referrer_idx
  on public.referral_rewards(referrer_family_id);

alter table public.referral_rewards enable row level security;
-- Sin políticas: solo el servidor (service_role) lee/escribe.
