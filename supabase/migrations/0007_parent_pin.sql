-- ============================================================
-- Migration 0007 — Clave del dashboard de padres POR FAMILIA
--
-- Antes la clave del panel de padres era una sola variable de entorno global
-- (la misma para todas las familias). Ahora cada familia guarda su propio PIN
-- hasheado, separado de la clave de acceso (login).
-- ============================================================

alter table public.families
  add column if not exists parent_pin_hash text;

-- Sin políticas extra: la familia ya puede leer/actualizar su propia fila
-- (políticas "family: owner can read/update own" de 0002_rls.sql).
