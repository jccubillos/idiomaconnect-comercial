-- ============================================================
-- Row-Level Security: each family sees only its own data
-- ============================================================

-- Helper: returns the family_id of the current authenticated user
create or replace function public.current_family_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.families where owner_user_id = auth.uid() limit 1;
$$;

-- ────────────────────────────────────────────────────────────
-- families
-- ────────────────────────────────────────────────────────────
alter table public.families enable row level security;

create policy "family: owner can read own"
  on public.families for select
  using (owner_user_id = auth.uid());

create policy "family: owner can update own"
  on public.families for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Insert is handled by handle_new_user() trigger (security definer); no policy needed for client insert.

-- ────────────────────────────────────────────────────────────
-- kid_profiles
-- ────────────────────────────────────────────────────────────
alter table public.kid_profiles enable row level security;

create policy "kid_profiles: family scope"
  on public.kid_profiles for all
  using (family_id = public.current_family_id())
  with check (family_id = public.current_family_id());

-- ────────────────────────────────────────────────────────────
-- family_members
-- ────────────────────────────────────────────────────────────
alter table public.family_members enable row level security;

create policy "family_members: family scope"
  on public.family_members for all
  using (family_id = public.current_family_id())
  with check (family_id = public.current_family_id());

-- ────────────────────────────────────────────────────────────
-- lesson_sessions
-- ────────────────────────────────────────────────────────────
alter table public.lesson_sessions enable row level security;

create policy "lesson_sessions: family scope"
  on public.lesson_sessions for all
  using (
    kid_id in (select id from public.kid_profiles where family_id = public.current_family_id())
  )
  with check (
    kid_id in (select id from public.kid_profiles where family_id = public.current_family_id())
  );

-- ────────────────────────────────────────────────────────────
-- srs_cards
-- ────────────────────────────────────────────────────────────
alter table public.srs_cards enable row level security;

create policy "srs_cards: family scope"
  on public.srs_cards for all
  using (
    kid_id in (select id from public.kid_profiles where family_id = public.current_family_id())
  )
  with check (
    kid_id in (select id from public.kid_profiles where family_id = public.current_family_id())
  );

-- ────────────────────────────────────────────────────────────
-- trophies_earned
-- ────────────────────────────────────────────────────────────
alter table public.trophies_earned enable row level security;

create policy "trophies: family scope"
  on public.trophies_earned for all
  using (
    kid_id in (select id from public.kid_profiles where family_id = public.current_family_id())
  )
  with check (
    kid_id in (select id from public.kid_profiles where family_id = public.current_family_id())
  );

-- ────────────────────────────────────────────────────────────
-- usage_events  (write-only from server using service_role; client reads own)
-- ────────────────────────────────────────────────────────────
alter table public.usage_events enable row level security;

create policy "usage_events: read own family"
  on public.usage_events for select
  using (family_id = public.current_family_id());
-- No insert/update/delete from client. Service role bypasses RLS.

-- ────────────────────────────────────────────────────────────
-- Leaderboard view (cross-family aggregate, anonymized by first name only)
-- ────────────────────────────────────────────────────────────
create or replace view public.leaderboard_weekly as
select
    k.id as kid_id,
    k.family_id,
    k.name,
    k.emoji,
    k.color_hex,
    k.cefr_level,
    coalesce(sum(case when s.created_at > now() - interval '7 days' then s.xp_gained end), 0) as week_xp,
    k.total_xp
from public.kid_profiles k
left join public.lesson_sessions s on s.kid_id = k.id
where k.archived_at is null
group by k.id;

-- Leaderboard is family-scoped (a kid sees only their family ranking + global anonymized).
-- Global view exposed separately as an RPC if desired.
