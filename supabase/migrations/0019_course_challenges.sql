-- ============================================================
-- Migration 0019 — ⚔️ DESAFÍOS ENTRE ALUMNOS DEL MISMO CURSO
--
-- Variante ESCOLAR del "Reto a un amigo": un alumno, al terminar una Battle en
-- el mundo del colegio, reta a un COMPAÑERO de su mismo curso. A diferencia del
-- reto público (link por WhatsApp), este es interno y acotado al curso: el
-- compañero lo ve en SU mundo del colegio y lo juega con las mismas palabras.
--
-- Reutiliza battle_challenges (palabras + puntaje del retador). Esta tabla solo
-- agrega el puntero: a QUÉ compañero va el reto, dentro de qué curso.
-- ============================================================

create table if not exists public.course_challenge_targets (
    id                 uuid primary key default gen_random_uuid(),
    challenge_id       uuid not null references public.battle_challenges(id) on delete cascade,
    course_id          uuid not null references public.courses(id) on delete cascade,
    challenger_kid_id  uuid references public.kid_profiles(id) on delete set null,
    target_kid_id      uuid not null references public.kid_profiles(id) on delete cascade,
    -- Denormalizado para listar sin más joins (nombre/apodo y puntaje del retador).
    challenger_name    text not null,
    challenger_score   integer not null check (challenger_score between 0 and 100),
    created_at         timestamptz not null default now(),
    expires_at         timestamptz not null default (now() + interval '14 days')
);

create index if not exists course_challenge_targets_target_idx
    on public.course_challenge_targets(target_kid_id, expires_at);
create index if not exists course_challenge_targets_course_idx
    on public.course_challenge_targets(course_id);

alter table public.course_challenge_targets enable row level security;
-- Sin políticas: solo el servidor (service_role) lee/escribe. La validación de
-- que retador y retado comparten curso se hace en el endpoint /api/school/challenge.
