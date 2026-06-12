-- ============================================================
-- Migration 0014 — Nuevos planes familiares: PLUS y VITALICIO
--
-- · family_plus     : suscripción anual premium (herramientas exclusivas:
--                     Arena Global, Reto a un amigo, Duelo Familiar).
-- · family_lifetime : pago ÚNICO de por vida — incluye Plus y todas las
--                     actualizaciones futuras (ver cláusula en /terms).
--
-- El trial de 7 días incluye las herramientas Plus (gancho de conversión).
-- ============================================================

alter table public.families drop constraint if exists families_plan_check;
alter table public.families
  add constraint families_plan_check
  check (plan in (
    'trial',
    'family_monthly',
    'family_yearly',
    'family_plus',
    'family_lifetime',
    'school',
    'expired'
  ));
