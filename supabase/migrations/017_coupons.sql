-- Migration: 017_coupons
-- Description: Adds coupons table and updates orders table to track coupon usage.

-- 1. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric(10,2) DEFAULT 0,
  usage_limit integer, -- NULL means unlimited
  usage_count integer DEFAULT 0,
  multiple_uses_per_customer boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, code)
);

-- 2. Add RLS Policies for coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read coupons (needed for storefront validation, though we might do it via service role)
CREATE POLICY "Public can read active coupons"
  ON coupons
  FOR SELECT
  USING (true);

-- Policy: Only restaurant owners and staff can manage coupons
CREATE POLICY "restaurant_staff can manage coupons"
  ON coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = coupons.restaurant_id
        AND rs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = coupons.restaurant_id
        AND rs.user_id = auth.uid()
    )
  );

-- 3. Add coupon tracking to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS coupon_code text,
ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0;

-- 4. Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_coupons_updated_at();
