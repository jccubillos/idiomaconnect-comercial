-- ============================================================
-- Migration 0018 — Cupos de niños por plan (max_kids)
--
-- La lista de precios oficial (junio 2026) limita los cupos según el plan:
--   · Mensual / Anual          → 2 niños
--   · Anual Familiar / Perpetuo → 6 niños
--   · Hotmart Starter          → 1 niño
--   · Hotmart Pro Family       → 6 niños
--
-- Antes el límite estaba fijo en 6 para todos. Ahora cada familia guarda su
-- propio tope (max_kids), que se fija al contratar y se respeta al crear perfiles.
--
-- Default 6: las cuentas EXISTENTES y los trials mantienen el comportamiento
-- anterior (no pierden perfiles ya creados). Las contrataciones nuevas fijan
-- el valor correcto desde el webhook de pagos / fulfillment de Hotmart.
-- ============================================================

-- 1. Tope de perfiles de niños por familia.
alter table public.families
  add column if not exists max_kids smallint not null default 6;

-- 2. El tope viaja también en la compra de Hotmart pendiente de reclamar,
--    para aplicarlo correctamente cuando el comprador crea su cuenta.
alter table public.hotmart_entitlements
  add column if not exists max_kids smallint;
