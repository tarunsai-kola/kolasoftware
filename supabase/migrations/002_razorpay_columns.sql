-- =============================================================================
-- Migration: 002_razorpay_columns.sql
-- Adds Razorpay-specific columns needed for payment integration.
-- =============================================================================
-- Changes:
--   restaurants.razorpay_account_id  — the restaurant's Razorpay linked sub-account
--   orders.razorpay_order_id         — the Razorpay order ID created by our API
--
-- Both columns are nullable because:
--   - Not every restaurant is onboarded onto Razorpay Route (razorpay_account_id)
--   - Orders don't have a Razorpay order until the customer initiates payment
-- =============================================================================

-- -----------------------------------------------------------------------------
-- restaurants: add Razorpay linked sub-account ID
-- Set manually by the platform admin after the restaurant completes Razorpay
-- Route onboarding. Null means the platform account receives the full payment
-- and manually settles with the restaurant.
-- -----------------------------------------------------------------------------
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS razorpay_account_id text;

COMMENT ON COLUMN restaurants.razorpay_account_id IS
  'Razorpay Route linked account ID (e.g. acc_XXXXX). '
  'When set, payments are automatically split via Razorpay Route: '
  '(total - platform_fee) is transferred to this account. '
  'Null = no automatic split; platform settles manually.';

-- -----------------------------------------------------------------------------
-- orders: add Razorpay order ID
-- Created by POST /api/payments/create-order when the customer initiates payment.
-- Used by the webhook to match payment events back to our order rows.
-- -----------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

COMMENT ON COLUMN orders.razorpay_order_id IS
  'Razorpay order ID returned by the Razorpay Orders API. '
  'Set by POST /api/payments/create-order after the order row is created. '
  'Used by the webhook handler to look up the order on payment.captured / payment.failed. '
  'Unique index (partial, WHERE NOT NULL) prevents duplicate Razorpay order creation.';

-- Confirm the index was created correctly
-- (run EXPLAIN to verify in Supabase SQL Editor if needed)

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
