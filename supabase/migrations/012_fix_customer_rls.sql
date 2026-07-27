-- Fix infinite recursion between customers and orders RLS

-- 1. Create a security definer function to get the current auth user's customer_id securely
CREATE OR REPLACE FUNCTION get_my_customer_id() 
RETURNS uuid
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT id FROM customers WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. Update the customer_addresses policies to use the function instead of a direct SELECT
DROP POLICY IF EXISTS "customer_addresses_select_own" ON customer_addresses;
CREATE POLICY "customer_addresses_select_own" ON customer_addresses FOR SELECT USING (customer_id = get_my_customer_id());

DROP POLICY IF EXISTS "customer_addresses_insert_own" ON customer_addresses;
CREATE POLICY "customer_addresses_insert_own" ON customer_addresses FOR INSERT WITH CHECK (customer_id = get_my_customer_id());

DROP POLICY IF EXISTS "customer_addresses_update_own" ON customer_addresses;
CREATE POLICY "customer_addresses_update_own" ON customer_addresses FOR UPDATE USING (customer_id = get_my_customer_id());

DROP POLICY IF EXISTS "customer_addresses_delete_own" ON customer_addresses;
CREATE POLICY "customer_addresses_delete_own" ON customer_addresses FOR DELETE USING (customer_id = get_my_customer_id());

-- 3. Update the orders policy to use the function
DROP POLICY IF EXISTS "customer_read_own_orders" ON orders;
CREATE POLICY "customer_read_own_orders" ON orders FOR SELECT USING (customer_id = get_my_customer_id());
