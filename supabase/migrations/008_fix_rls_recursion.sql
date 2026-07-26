-- Migration: 008_fix_rls_recursion.sql
-- Fixes infinite recursion in restaurant_staff RLS policies by using 
-- SECURITY DEFINER helper functions that bypass RLS for self-referential checks.

-- 1. Helper to get restaurants where user is staff (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_restaurant_ids()
RETURNS SETOF uuid
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 2. Helper to get restaurants where user is owner (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_owned_restaurant_ids()
RETURNS SETOF uuid
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid() AND role = 'owner';
$$ LANGUAGE sql STABLE;

-- 3. Drop the old recursive policies
DROP POLICY IF EXISTS "restaurant_staff: staff can view colleagues at same restaurant" ON restaurant_staff;
DROP POLICY IF EXISTS "restaurant_staff: owners can manage staff for their restaurant" ON restaurant_staff;
DROP POLICY IF EXISTS "restaurant_staff: owners can delete staff from their restaurant" ON restaurant_staff;

-- 4. Create the new non-recursive policies
CREATE POLICY "restaurant_staff: staff can view colleagues at same restaurant"
  ON restaurant_staff
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (SELECT get_user_restaurant_ids())
  );

CREATE POLICY "restaurant_staff: owners can manage staff for their restaurant"
  ON restaurant_staff
  FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (SELECT get_user_owned_restaurant_ids())
  );

CREATE POLICY "restaurant_staff: owners can delete staff from their restaurant"
  ON restaurant_staff
  FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (SELECT get_user_owned_restaurant_ids())
  );
