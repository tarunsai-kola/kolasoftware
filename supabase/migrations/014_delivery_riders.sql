-- Migration: 014_delivery_riders.sql
-- Description: Creates a standalone table for delivery riders managed by the restaurant owner

CREATE TABLE IF NOT EXISTS delivery_riders (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid           NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text           NOT NULL,
  phone         text           NOT NULL,
  vehicle_info  text,
  is_active     boolean        NOT NULL DEFAULT true,
  created_at    timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE delivery_riders IS
  'Delivery riders managed by the restaurant owner. Does not require Supabase auth login.';

-- Drop the old assigned_driver_id if it exists, and add delivery_rider_id
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_rider_id uuid REFERENCES delivery_riders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE delivery_riders ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant owners and staff can manage their own riders
CREATE POLICY "restaurant_staff can manage riders"
  ON delivery_riders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = delivery_riders.restaurant_id
        AND rs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = delivery_riders.restaurant_id
        AND rs.user_id = auth.uid()
    )
  );

-- Policy: Super admins can do anything
CREATE POLICY "platform_admins have full access to riders"
  ON delivery_riders
  FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
