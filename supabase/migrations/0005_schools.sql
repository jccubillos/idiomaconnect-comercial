-- ============================================================
-- Migration 0005 — Cuentas institucionales (colegios)
--
-- Estrategia: un COLEGIO es una fila de `families` con org_type='school'.
-- Reutiliza TODO el motor de aprendizaje (kid_profiles, lesson_sessions,
-- srs_cards, etc.). Los ALUMNOS son kid_profiles del colegio.
--
-- Se agregan: staff (admin/profesores), cursos, asignación profesor↔curso,
-- vínculo alumno→curso, y leads del formulario de contacto.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. families → organización genérica (familia o colegio)
-- ────────────────────────────────────────────────────────────
alter table public.families
  add column if not exists org_type text not null default 'family'
    check (org_type in ('family', 'school'));

-- Cupos máximos de alumnos (solo colegios). NULL en familias = límite de app (6).
alter table public.families
  add column if not exists seats integer;

-- Metadatos de contacto del colegio (opcionales).
alter table public.families add column if not exists contact_email text;
alter table public.families add column if not exists contact_phone text;
alter table public.families add column if not exists address text;
alter table public.families add column if not exists comuna text;
alter table public.families add column if not exists region text;

-- Permitir el plan 'school' además de los familiares.
alter table public.families drop constraint if exists families_plan_check;
alter table public.families
  add constraint families_plan_check
  check (plan in ('trial', 'family_monthly', 'family_yearly', 'school', 'expired'));

-- ────────────────────────────────────────────────────────────
-- 2. STAFF — profesores y administradores de un colegio
-- ────────────────────────────────────────────────────────────
create table if not exists public.staff_members (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references public.families(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    full_name   text,
    role        text not null check (role in ('admin', 'teacher')),
    created_at  timestamptz not null default now(),
    unique (org_id, user_id)
);

create index if not exists staff_members_user_idx on public.staff_members(user_id);
create index if not exists staff_members_org_idx  on public.staff_members(org_id);

-- ────────────────────────────────────────────────────────────
-- 3. COURSES — cursos del colegio (7°A, 8°B, …)
-- ────────────────────────────────────────────────────────────
create table if not exists public.courses (
    id              uuid primary key default gen_random_uuid(),
    org_id          uuid not null references public.families(id) on delete cascade,
    name            text not null,            -- "7°A"
    grade_label     text,                     -- "7° básico"
    -- FASE 2: contexto institucional inyectado a las lecciones del curso.
    current_theme   text,                     -- título corto: "Present continuous · deportes"
    current_context text,                     -- instrucción libre del profe para la IA
    context_updated_at timestamptz,
    created_at      timestamptz not null default now(),
    archived_at     timestamptz
);

create index if not exists courses_org_idx on public.courses(org_id);

-- ────────────────────────────────────────────────────────────
-- 4. COURSE_TEACHERS — asignación profesor ↔ curso (N:M)
-- ────────────────────────────────────────────────────────────
create table if not exists public.course_teachers (
    course_id   uuid not null references public.courses(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    created_at  timestamptz not null default now(),
    primary key (course_id, user_id)
);

create index if not exists course_teachers_user_idx on public.course_teachers(user_id);

-- ────────────────────────────────────────────────────────────
-- 5. kid_profiles → vínculo opcional a un curso (alumnos de colegio)
-- ────────────────────────────────────────────────────────────
alter table public.kid_profiles
  add column if not exists course_id uuid references public.courses(id) on delete set null;

create index if not exists kid_profiles_course_idx on public.kid_profiles(course_id);

-- ────────────────────────────────────────────────────────────
-- 6. SCHOOL_LEADS — solicitudes del formulario "Colegios e Instituciones"
-- ────────────────────────────────────────────────────────────
create table if not exists public.school_leads (
    id                  uuid primary key default gen_random_uuid(),
    institution_name    text not null,
    address             text,
    comuna              text,
    region              text,
    contact_name        text not null,
    contact_role        text,
    phone               text,
    email               text not null,
    num_students        integer,
    levels              text,         -- 'basica' | 'media' | 'ambos'
    has_english_teacher boolean,
    message             text,
    status              text not null default 'new'
                          check (status in ('new', 'contacted', 'won', 'lost')),
    created_at          timestamptz not null default now()
);

create index if not exists school_leads_status_idx on public.school_leads(status, created_at desc);
