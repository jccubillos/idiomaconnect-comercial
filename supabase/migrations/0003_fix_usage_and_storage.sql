-- ============================================================
-- Migration 0003 — fixes blocking issues found in audit
--
-- 1. usage_events INSERT was blocked by RLS (only SELECT policy existed).
--    Adding scoped INSERT policy.
-- 2. avatars storage bucket + public read policy + family-scoped write.
-- 3. lesson_sessions: add useful index for arena leaderboard.
-- ============================================================

-- ── 1. usage_events: allow INSERT scoped to current family ─
create policy "usage_events: insert own family"
  on public.usage_events for insert
  with check (family_id = public.current_family_id());

-- (kept) "usage_events: read own family" already exists from 0002_rls.sql

-- ── 2. Avatars Storage bucket ──────────────────────────────
-- Supabase storage policies live in storage.objects.
-- Create the bucket if it doesn't exist (idempotent).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2 * 1024 * 1024,           -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Public can read (the bucket is public, but explicit policy keeps things clear)
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload to their family folder only.
-- Path convention enforced by /api/avatar/upload: {family_id}/{kid_id}-{ts}.{ext}
drop policy if exists "avatars family write" on storage.objects;
create policy "avatars family write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );

drop policy if exists "avatars family update" on storage.objects;
create policy "avatars family update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );

drop policy if exists "avatars family delete" on storage.objects;
create policy "avatars family delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );

-- ── 3. Helpful indexes ─────────────────────────────────────
-- Arena view aggregates by week; lookup by created_at desc is hot.
create index if not exists lesson_sessions_recent_idx
  on public.lesson_sessions(created_at desc);

-- usage_events monthly cost rollup
create index if not exists usage_events_family_month_idx
  on public.usage_events(family_id, created_at desc);

-- ── 4. Tighten kid_profiles update path ────────────────────
-- The existing kid_profiles policy ("family scope") covers ALL operations,
-- including update of avatar_url after upload. No change needed.
