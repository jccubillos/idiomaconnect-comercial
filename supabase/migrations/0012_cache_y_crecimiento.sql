-- ============================================================
-- Migration 0012 — Caché de audio + columnas de crecimiento
--
-- 1. Bucket "tts-cache": guarda los MP3 ya sintetizados. Cada frase se paga a
--    OpenAI UNA sola vez; las repeticiones salen del caché (≈ -70% costo de voz).
-- 2. families.discount_code: código de descuento usado al contratar (visible
--    en el dashboard de administración).
-- 3. courses.weekly_goal_xp: misión grupal semanal del mundo "Lumi en tu
--    Colegio" (meta de XP del curso; Lumi celebra al lograrla).
-- ============================================================

-- 1. Caché de audio (privado: solo el servidor lee/escribe).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tts-cache', 'tts-cache', false, 5242880, array['audio/mpeg'])
on conflict (id) do nothing;

-- 2. Código de descuento aplicado por la familia al contratar.
alter table public.families
  add column if not exists discount_code text;

-- 3. Meta semanal de XP del curso (misión grupal). NULL = sin misión.
alter table public.courses
  add column if not exists weekly_goal_xp integer;
