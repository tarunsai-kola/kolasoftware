-- Migration: 018_razorpay_keys
-- Description: Adds per-restaurant Razorpay keys and payment method options

-- 1. Add columns to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS razorpay_key_id text,
ADD COLUMN IF NOT EXISTS razorpay_key_secret text,
ADD COLUMN IF NOT EXISTS razorpay_webhook_secret text,
ADD COLUMN IF NOT EXISTS is_cod_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_online_payment_enabled boolean DEFAULT false;

-- 2. Add payment_method to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cod', 'online'));

-- 3. Update the restaurants_public view to include the new boolean flags but EXCLUDE the secrets
-- Drop the view first because we are changing the SELECT list.
-- Note: Views must be dropped and recreated if columns change.
DROP VIEW IF EXISTS restaurants_public;

CREATE VIEW restaurants_public AS
  SELECT
    id,
    name,
    domain,
    subdomain,
    logo_url,
    primary_color,
    font_family,
    banner_image_url,
    status,
    is_cod_enabled,
    is_online_payment_enabled
  FROM restaurants
  WHERE status = 'active';

COMMENT ON VIEW restaurants_public IS
  'Safe public view of restaurants — excludes owner_id, kitchen_email, billing columns, and payment secrets. '
  'Use this view in storefront queries; never SELECT * FROM restaurants in public-facing code.';
