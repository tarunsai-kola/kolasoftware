-- Migration: 015_rider_auth.sql
-- Description: Adds user_id to delivery_riders to allow riders to log in via Supabase Auth

ALTER TABLE delivery_riders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Allow riders to read their own delivery_riders row
CREATE POLICY "riders can view own profile"
  ON delivery_riders
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow riders to read orders assigned to them
CREATE POLICY "riders can read assigned orders"
  ON orders
  FOR SELECT
  USING (delivery_rider_id IN (
    SELECT id FROM delivery_riders WHERE user_id = auth.uid()
  ));

-- Allow riders to update status of their assigned orders
CREATE POLICY "riders can update assigned orders"
  ON orders
  FOR UPDATE
  USING (delivery_rider_id IN (
    SELECT id FROM delivery_riders WHERE user_id = auth.uid()
  ))
  WITH CHECK (delivery_rider_id IN (
    SELECT id FROM delivery_riders WHERE user_id = auth.uid()
  ));
