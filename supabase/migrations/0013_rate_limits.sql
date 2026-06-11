-- ============================================================
-- Migration 0013 — Límites de uso multi-servidor + índice del mundo colegio
--
-- Problema: los límites anti-abuso vivían en la memoria de cada servidor.
-- Con varios servidores simultáneos (serverless), cada uno contaba por su
-- cuenta y el límite real se multiplicaba. Esta tabla + función cuentan de
-- forma ATÓMICA y GLOBAL en la base de datos (ventana fija por período).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. RATE_LIMITS — contadores por usuario/acción/ventana
-- ────────────────────────────────────────────────────────────
create table if not exists public.rate_limits (
    key             text primary key,        -- "userId:tipo:ventana"
    count           integer not null,
    window_ends_at  timestamptz not null
);

create index if not exists rate_limits_expiry_idx on public.rate_limits(window_ends_at);

alter table public.rate_limits enable row level security;
-- Sin políticas: solo el servidor (service_role) la usa.

-- ────────────────────────────────────────────────────────────
-- 2. RPC atómica: incrementa y devuelve si está permitido
-- ────────────────────────────────────────────────────────────
create or replace function public.rate_limit_hit(p_key text, p_limit integer, p_window_sec integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_bucket bigint := floor(extract(epoch from now()) / p_window_sec);
  v_key text := p_key || ':' || v_bucket::text;
  v_ends timestamptz := to_timestamp((v_bucket + 1) * p_window_sec);
  v_count integer;
begin
  insert into public.rate_limits as rl (key, count, window_ends_at)
  values (v_key, 1, v_ends)
  on conflict (key) do update set count = rl.count + 1
  returning rl.count into v_count;

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'remaining', greatest(0, p_limit - v_count),
    'reset_in', greatest(1, ceil(extract(epoch from (v_ends - now()))))::int
  );
end $$;

-- Solo el servidor puede ejecutarla (los clientes no deben tocar los contadores).
revoke execute on function public.rate_limit_hit(text, integer, integer) from public;
revoke execute on function public.rate_limit_hit(text, integer, integer) from anon;
revoke execute on function public.rate_limit_hit(text, integer, integer) from authenticated;

-- ────────────────────────────────────────────────────────────
-- 3. Índice para el mundo del colegio (racha, liga, misión, informes)
-- ────────────────────────────────────────────────────────────
create index if not exists lesson_sessions_kid_world_idx
  on public.lesson_sessions(kid_id, world_key, created_at desc);
