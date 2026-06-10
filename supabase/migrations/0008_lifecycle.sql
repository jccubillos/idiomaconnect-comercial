-- ============================================================
-- Migration 0008 — Ciclo de vida comercial (trials, cobranza, correos)
--
-- Reglas de negocio (decididas por JC, 2026-06-10):
--  · 1 trial por correo PARA SIEMPRE (sobrevive al borrado de la cuenta);
--    re-trial solo autorizado desde administración.
--  · Falla de pago familiar: correos cada 2 días (máx 15), datos 30 días.
--  · Falla de pago colegio: correos cada 2 días (máx 30), datos 180 días.
--  · Post-trial sin compra: correos cada 2 días ×15, luego cada 7 días ×8.
--  · Oferta 15% anual si en el trial logró ≥200 XP o subió de nivel.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. families — ancla de cobranza y baja de marketing
-- ────────────────────────────────────────────────────────────
alter table public.families
  add column if not exists payment_failed_at timestamptz;

alter table public.families
  add column if not exists marketing_opt_out boolean not null default false;

-- ────────────────────────────────────────────────────────────
-- 2. TRIAL_REGISTRY — 1 trial por correo, para siempre
--    (independiente de auth.users: sobrevive al borrado de la cuenta)
-- ────────────────────────────────────────────────────────────
create table if not exists public.trial_registry (
    email               text primary key,           -- siempre en minúsculas
    first_trial_at      timestamptz not null default now(),
    -- La administración puede autorizar UN nuevo trial para este correo.
    retrial_authorized  boolean not null default false,
    retrial_authorized_at timestamptz
);

alter table public.trial_registry enable row level security;
-- Sin políticas: solo service_role (servidor) lee/escribe.

-- ────────────────────────────────────────────────────────────
-- 3. EMAIL_LOG — control de cadencias y máximos de cada secuencia
-- ────────────────────────────────────────────────────────────
create table if not exists public.email_log (
    id          uuid primary key default gen_random_uuid(),
    family_id   uuid references public.families(id) on delete set null,
    email       text not null,
    kind        text not null,   -- 'post_trial' | 'offer15' | 'dunning_family' | 'dunning_school' | ...
    sent_at     timestamptz not null default now(),
    meta        jsonb
);

create index if not exists email_log_family_kind_idx on public.email_log(family_id, kind, sent_at desc);
create index if not exists email_log_email_kind_idx  on public.email_log(email, kind);

alter table public.email_log enable row level security;
-- Sin políticas: solo service_role.

-- ────────────────────────────────────────────────────────────
-- 4. handle_new_user() — aplica "1 trial por correo para siempre"
--    Si el correo ya usó su trial (y no tiene re-trial autorizado),
--    la familia nueva nace SIN trial (plan 'expired' → paywall inmediato).
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_used  record;
begin
  select * into v_used from public.trial_registry where email = v_email;

  if v_used is null then
    -- Primer trial de este correo: registrarlo y crear familia con trial normal.
    insert into public.trial_registry (email) values (v_email)
    on conflict (email) do nothing;

    insert into public.families (owner_user_id, family_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'family_name', 'Mi familia'));

  elsif v_used.retrial_authorized then
    -- Re-trial autorizado por administración: consumirlo y dar trial normal.
    update public.trial_registry
      set retrial_authorized = false
      where email = v_email;

    insert into public.families (owner_user_id, family_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'family_name', 'Mi familia'));

  else
    -- Ya usó su trial: la cuenta nace expirada (puede suscribirse, sin días gratis).
    insert into public.families (owner_user_id, family_name, plan, trial_ends_at)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'family_name', 'Mi familia'),
      'expired',
      now()
    );
  end if;

  return new;
end $$;
