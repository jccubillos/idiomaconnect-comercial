-- ============================================================
-- Migration 0006 — RLS para cuentas institucionales
--
-- Modelo de acceso:
--   • ADMIN de colegio  → ve y gestiona TODO su colegio (alumnos, cursos, staff).
--   • PROFESOR          → ve solo los alumnos de SUS cursos (solo lectura del avance).
--   • FAMILIA           → sin cambios (políticas existentes siguen vigentes).
--
-- Las políticas RLS son PERMISIVAS: se SUMAN (OR) a las de familia ya existentes.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Helpers (security definer → evitan recursión de RLS)
-- ────────────────────────────────────────────────────────────

-- Orgs donde el usuario es staff (admin o profesor).
create or replace function public.user_staff_org_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select org_id from public.staff_members where user_id = auth.uid();
$$;

-- Orgs donde el usuario es ADMIN.
create or replace function public.user_admin_org_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select org_id from public.staff_members where user_id = auth.uid() and role = 'admin';
$$;

-- Cursos que el usuario dicta (profesor).
create or replace function public.user_teacher_course_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select course_id from public.course_teachers where user_id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────
-- staff_members
-- ────────────────────────────────────────────────────────────
alter table public.staff_members enable row level security;

-- Cada miembro lee sus propias membresías (para detectar su rol al iniciar sesión).
create policy "staff: read own membership"
  on public.staff_members for select
  using (user_id = auth.uid());

-- El admin gestiona el staff de su colegio.
create policy "staff: admin manages org staff"
  on public.staff_members for all
  using (org_id in (select public.user_admin_org_ids()))
  with check (org_id in (select public.user_admin_org_ids()));

-- ────────────────────────────────────────────────────────────
-- courses
-- ────────────────────────────────────────────────────────────
alter table public.courses enable row level security;

-- Todo el staff del colegio puede LEER los cursos.
create policy "courses: staff read"
  on public.courses for select
  using (org_id in (select public.user_staff_org_ids()));

-- El admin gestiona (crea/edita/archiva) cursos.
create policy "courses: admin manage"
  on public.courses for all
  using (org_id in (select public.user_admin_org_ids()))
  with check (org_id in (select public.user_admin_org_ids()));

-- El profesor puede ACTUALIZAR el contexto institucional de SUS cursos (Fase 2).
create policy "courses: teacher updates own context"
  on public.courses for update
  using (id in (select public.user_teacher_course_ids()))
  with check (id in (select public.user_teacher_course_ids()));

-- ────────────────────────────────────────────────────────────
-- course_teachers
-- ────────────────────────────────────────────────────────────
alter table public.course_teachers enable row level security;

-- El profesor ve sus propias asignaciones.
create policy "course_teachers: read own"
  on public.course_teachers for select
  using (user_id = auth.uid());

-- El admin gestiona asignaciones de su colegio.
create policy "course_teachers: admin manage"
  on public.course_teachers for all
  using (course_id in (select id from public.courses where org_id in (select public.user_admin_org_ids())))
  with check (course_id in (select id from public.courses where org_id in (select public.user_admin_org_ids())));

-- ────────────────────────────────────────────────────────────
-- kid_profiles  (alumnos de colegio)
-- ────────────────────────────────────────────────────────────
-- El admin gestiona TODOS los alumnos de su colegio.
create policy "kid_profiles: school admin all"
  on public.kid_profiles for all
  using (family_id in (select public.user_admin_org_ids()))
  with check (family_id in (select public.user_admin_org_ids()));

-- El profesor LEE los alumnos de sus cursos.
create policy "kid_profiles: teacher read course students"
  on public.kid_profiles for select
  using (course_id in (select public.user_teacher_course_ids()));

-- ────────────────────────────────────────────────────────────
-- lesson_sessions  (avance — staff solo lectura)
-- ────────────────────────────────────────────────────────────
create policy "lesson_sessions: school admin read"
  on public.lesson_sessions for select
  using (kid_id in (
    select id from public.kid_profiles where family_id in (select public.user_admin_org_ids())
  ));

create policy "lesson_sessions: teacher read"
  on public.lesson_sessions for select
  using (kid_id in (
    select id from public.kid_profiles where course_id in (select public.user_teacher_course_ids())
  ));

-- ────────────────────────────────────────────────────────────
-- srs_cards  (staff solo lectura, para ver vocabulario en repaso)
-- ────────────────────────────────────────────────────────────
create policy "srs_cards: school admin read"
  on public.srs_cards for select
  using (kid_id in (
    select id from public.kid_profiles where family_id in (select public.user_admin_org_ids())
  ));

create policy "srs_cards: teacher read"
  on public.srs_cards for select
  using (kid_id in (
    select id from public.kid_profiles where course_id in (select public.user_teacher_course_ids())
  ));

-- ════════════════════════════════════════════════════════════
-- PRÁCTICA SUPERVISADA — el staff puede REGISTRAR el avance de sus alumnos.
--
-- El ADMIN ya tiene acceso total a su colegio vía "family scope" (es el dueño
-- del registro families del colegio), así que NO necesita políticas extra.
-- El PROFESOR sí: se le permite escribir progreso SOLO de alumnos de sus cursos.
-- Esto habilita que un alumno practique en un dispositivo con la sesión del profe.
-- ════════════════════════════════════════════════════════════

-- kid_profiles: el profesor actualiza el progreso (XP, nivel, mundo) de sus alumnos.
create policy "kid_profiles: teacher update course students"
  on public.kid_profiles for update
  using (course_id in (select public.user_teacher_course_ids()))
  with check (course_id in (select public.user_teacher_course_ids()));

-- lesson_sessions: el profesor inserta sesiones de sus alumnos.
create policy "lesson_sessions: teacher insert"
  on public.lesson_sessions for insert
  with check (kid_id in (
    select id from public.kid_profiles where course_id in (select public.user_teacher_course_ids())
  ));

-- trophies_earned: el profesor registra logros de sus alumnos.
create policy "trophies: teacher insert"
  on public.trophies_earned for insert
  with check (kid_id in (
    select id from public.kid_profiles where course_id in (select public.user_teacher_course_ids())
  ));

-- srs_cards: el profesor crea/actualiza tarjetas de repaso de sus alumnos.
create policy "srs_cards: teacher insert"
  on public.srs_cards for insert
  with check (kid_id in (
    select id from public.kid_profiles where course_id in (select public.user_teacher_course_ids())
  ));
create policy "srs_cards: teacher update"
  on public.srs_cards for update
  using (kid_id in (
    select id from public.kid_profiles where course_id in (select public.user_teacher_course_ids())
  ))
  with check (kid_id in (
    select id from public.kid_profiles where course_id in (select public.user_teacher_course_ids())
  ));

-- ────────────────────────────────────────────────────────────
-- school_leads  (formulario público de contacto)
-- ────────────────────────────────────────────────────────────
alter table public.school_leads enable row level security;

-- Cualquiera (anónimo o autenticado) puede ENVIAR una solicitud.
create policy "school_leads: anyone can submit"
  on public.school_leads for insert
  with check (true);

-- Nadie lee desde el cliente. Solo el service_role (bypassa RLS) lo administra.
