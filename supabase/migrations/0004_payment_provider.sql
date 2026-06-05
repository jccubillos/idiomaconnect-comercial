-- ============================================================
-- Migration 0004 — generalize payment columns for provider-agnostic billing.
--
-- Why: Stripe doesn't accept Chilean merchant accounts. We're using Lemon
-- Squeezy as Merchant of Record. The schema needs to be provider-agnostic
-- so we can swap providers later (or run multiple in parallel).
--
-- Changes:
--   1. Rename stripe_customer_id      → payment_customer_id
--   2. Rename stripe_subscription_id  → payment_subscription_id
--   3. Add payment_provider column ('lemonsqueezy' | 'stripe' | ...)
-- ============================================================

alter table public.families
  rename column stripe_customer_id to payment_customer_id;

alter table public.families
  rename column stripe_subscription_id to payment_subscription_id;

alter table public.families
  add column if not exists payment_provider text default 'lemonsqueezy'
    check (payment_provider in ('lemonsqueezy', 'stripe', 'paddle', 'mercadopago', 'flow'));

-- The old indexes are auto-renamed by Postgres alongside the columns.
-- (families_stripe_idx → families_payment_customer_id_idx implicitly,
--  but to be safe we drop+recreate by the new name.)
drop index if exists families_stripe_idx;
create index if not exists families_payment_idx
  on public.families(payment_customer_id);
