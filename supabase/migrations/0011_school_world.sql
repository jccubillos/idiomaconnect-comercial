-- ============================================================
-- Migration 0011 — Mundo del colegio: "Lumi en tu Colegio"
--
-- Mundo EXCLUSIVO para alumnos de colegio (kid_profiles.course_id != null).
-- El profesor lo personaliza curso por curso:
--   · world_message  : mensaje del profesor que Lumi muestra a los alumnos.
--   · enabled_modes  : qué herramientas (de las 16) están activas en el mundo.
--   · course_evaluations : evaluaciones/contenidos que la IA convierte en
--     práctica de entrenamiento dentro del mundo.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. courses — personalización del mundo del colegio
-- ────────────────────────────────────────────────────────────
alter table public.courses
  add column if not exists world_message text;          -- "El profesor dice…"

alter table public.courses
  add column if not exists enabled_modes jsonb;          -- ej. ["lesson","battle",...]; null = set por defecto

-- ────────────────────────────────────────────────────────────
-- 2. COURSE_EVALUATIONS — evaluaciones de entrenamiento por curso
-- ────────────────────────────────────────────────────────────
create table if not exists public.course_evaluations (
    id          uuid primary key default gen_random_uuid(),
    course_id   uuid not null references public.courses(id) on delete cascade,
    title       text not null,            -- "Prueba unidad 3: pasado simple"
    content     text not null,            -- materia/preguntas que la IA usará para generar la práctica
    active      boolean not null default true,
    created_at  timestamptz not null default now()
);

create index if not exists course_evaluations_course_idx on public.course_evaluations(course_id, active);

alter table public.course_evaluations enable row level security;

-- Todo el staff del colegio puede LEER las evaluaciones de los cursos de su org
-- (incluye al profesor en Modo Aula, cuya sesión usa el alumno para practicar).
create policy "course_evaluations: staff read"
  on public.course_evaluations for select
  using (course_id in (
    select id from public.courses where org_id in (select public.user_staff_org_ids())
  ));

-- El profesor gestiona las evaluaciones de SUS cursos.
create policy "course_evaluations: teacher manage"
  on public.course_evaluations for all
  using (course_id in (select public.user_teacher_course_ids()))
  with check (course_id in (select public.user_teacher_course_ids()));

-- El admin del colegio gestiona las de toda su org.
create policy "course_evaluations: admin manage"
  on public.course_evaluations for all
  using (course_id in (
    select id from public.courses where org_id in (select public.user_admin_org_ids())
  ))
  with check (course_id in (
    select id from public.courses where org_id in (select public.user_admin_org_ids())
  ));
