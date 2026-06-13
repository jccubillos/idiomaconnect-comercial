-- ============================================================
-- Migration 0015 — ⚔️ RETO A UN AMIGO (herramienta Plus, motor viral)
--
-- Un niño con Plus termina una Battle y genera un reto: un link público
-- (idiomaconnect.com/reto/<id>) que comparte por WhatsApp. El amigo ve el
-- desafío ("Martina sacó 92% — ¿la superas?") y para jugarlo necesita una
-- cuenta (trial gratis) → cada reto compartido es un registro potencial.
--
-- · Crear retos: SOLO Plus/Vitalicio (y trial vigente).
-- · Jugar retos: cualquier cuenta — esa es la parte viral.
-- ============================================================

create table if not exists public.battle_challenges (
    id              uuid primary key default gen_random_uuid(),
    creator_kid_id  uuid references public.kid_profiles(id) on delete set null,
    -- Datos denormalizados del retador (el link sigue vivo aunque borre la cuenta;
    -- solo nombre de pila/apodo + emoji + nivel: nada identificable de la familia).
    creator_name    text not null,
    creator_emoji   text,
    creator_level   text not null default 'A1',
    score_pct       integer not null check (score_pct between 0 and 100),
    -- Las MISMAS palabras y opciones de la batalla original (duelo justo).
    words           jsonb not null,
    plays           integer not null default 0,
    created_at      timestamptz not null default now(),
    expires_at      timestamptz not null default (now() + interval '30 days')
);

create index if not exists battle_challenges_creator_idx on public.battle_challenges(creator_kid_id);

alter table public.battle_challenges enable row level security;
-- Sin políticas: solo el servidor (service_role) lee/escribe. La página pública
-- /reto/<id> la sirve el servidor mostrando solo el teaser.
