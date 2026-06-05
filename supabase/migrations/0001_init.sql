-- ============================================================
-- IdiomaConnect — Initial schema
-- Multi-tenant: 1 auth user = 1 family. Children = kid_profiles.
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1. FAMILIES (one row per auth user)
-- ────────────────────────────────────────────────────────────
create table public.families (
    id              uuid primary key default gen_random_uuid(),
    owner_user_id   uuid not null unique references auth.users(id) on delete cascade,
    family_name     text not null,
    -- Stripe
    stripe_customer_id      text unique,
    stripe_subscription_id  text unique,
    plan            text not null default 'trial' check (plan in ('trial', 'family_monthly', 'family_yearly', 'expired')),
    trial_ends_at   timestamptz not null default (now() + interval '7 days'),
    subscription_status text default 'trialing',
    -- Compliance
    parental_consent_at     timestamptz,
    privacy_accepted_at     timestamptz,
    tos_accepted_at         timestamptz,
    -- Audit
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index families_owner_idx on public.families(owner_user_id);
create index families_stripe_idx on public.families(stripe_customer_id);

-- ────────────────────────────────────────────────────────────
-- 2. KID PROFILES (children of a family)
-- ────────────────────────────────────────────────────────────
create table public.kid_profiles (
    id              uuid primary key default gen_random_uuid(),
    family_id       uuid not null references public.families(id) on delete cascade,
    name            text not null,
    birth_date      date,
    -- Personalization
    emoji           text default '👤',
    avatar_url      text,
    color_hex       text not null default '#00EEFC',
    gradient        text,
    -- Pedagogy hints (used to flavor prompts)
    hobbies         text,
    tone            text,
    grade           text,                       -- e.g. "8vo básico"
    -- Progress
    total_xp        integer not null default 0,
    cefr_level      text not null default 'A1' check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
    current_world   text default 'london_hub',
    -- Audit
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    archived_at     timestamptz
);

create index kid_profiles_family_idx on public.kid_profiles(family_id);
create unique index kid_profiles_family_name_idx on public.kid_profiles(family_id, lower(name)) where archived_at is null;

-- ────────────────────────────────────────────────────────────
-- 3. FAMILY MEMBERS (context injected into prompts)
-- ────────────────────────────────────────────────────────────
create table public.family_members (
    id              uuid primary key default gen_random_uuid(),
    family_id       uuid not null references public.families(id) on delete cascade,
    relation        text not null,              -- "padre","madre","hermano","abuela","mascota_perro",...
    name            text not null,
    age             integer,
    notes           text,
    created_at      timestamptz not null default now()
);

create index family_members_family_idx on public.family_members(family_id);

-- ────────────────────────────────────────────────────────────
-- 4. LESSON SESSIONS (every completed lesson)
-- ────────────────────────────────────────────────────────────
create table public.lesson_sessions (
    id              uuid primary key default gen_random_uuid(),
    kid_id          uuid not null references public.kid_profiles(id) on delete cascade,
    world_key       text,
    lesson_type     text not null,              -- 'lesson','pronunciation','flashcards','battle',...
    topic           text,
    skill           text,                       -- 'vocabulary','grammar','listening','speaking','writing','reading'
    score_pct       numeric(5,2),               -- 0..100
    xp_gained       integer not null default 0,
    attempts        integer default 1,
    duration_seconds integer,
    raw_payload     jsonb,                       -- prompt/answers snapshot for audit
    created_at      timestamptz not null default now()
);

create index lesson_sessions_kid_idx on public.lesson_sessions(kid_id, created_at desc);
create index lesson_sessions_kid_skill_idx on public.lesson_sessions(kid_id, skill);

-- ────────────────────────────────────────────────────────────
-- 5. SRS CARDS (spaced repetition vocabulary)
-- ────────────────────────────────────────────────────────────
create table public.srs_cards (
    id              uuid primary key default gen_random_uuid(),
    kid_id          uuid not null references public.kid_profiles(id) on delete cascade,
    word_en         text not null,
    translation_es  text,
    example_sentence text,
    -- SM-2 algorithm state
    interval_days   integer not null default 1,
    ease_factor     numeric(4,2) not null default 2.5,
    repetition      integer not null default 0,
    due_at          timestamptz not null default now(),
    last_quality    integer,                    -- 0..5
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create unique index srs_cards_kid_word_idx on public.srs_cards(kid_id, lower(word_en));
create index srs_cards_due_idx on public.srs_cards(kid_id, due_at);

-- ────────────────────────────────────────────────────────────
-- 6. TROPHIES EARNED
-- ────────────────────────────────────────────────────────────
create table public.trophies_earned (
    id              uuid primary key default gen_random_uuid(),
    kid_id          uuid not null references public.kid_profiles(id) on delete cascade,
    trophy_key      text not null,              -- references content/trophies.ts catalog
    earned_at       timestamptz not null default now()
);

create unique index trophies_kid_key_idx on public.trophies_earned(kid_id, trophy_key);

-- ────────────────────────────────────────────────────────────
-- 7. USAGE METRICS (cost control & rate limiting)
-- ────────────────────────────────────────────────────────────
create table public.usage_events (
    id              uuid primary key default gen_random_uuid(),
    family_id       uuid not null references public.families(id) on delete cascade,
    kid_id          uuid references public.kid_profiles(id) on delete set null,
    event_type      text not null,              -- 'lesson_generate','whisper_transcribe','tts','llm_chat'
    tokens_used     integer,
    cost_usd_cents  integer,
    created_at      timestamptz not null default now()
);

create index usage_events_family_idx on public.usage_events(family_id, created_at desc);

-- ────────────────────────────────────────────────────────────
-- TRIGGERS — auto-update updated_at
-- ────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger families_touch_updated before update on public.families
    for each row execute function public.touch_updated_at();

create trigger kid_profiles_touch_updated before update on public.kid_profiles
    for each row execute function public.touch_updated_at();

create trigger srs_cards_touch_updated before update on public.srs_cards
    for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────
-- TRIGGER — auto-create family on auth signup
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.families (owner_user_id, family_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'family_name', 'Mi familia'));
  return new;
end $$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
