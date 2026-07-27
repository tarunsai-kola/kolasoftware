-- =============================================================================
-- 011_customer_auth.sql
-- Customer authentication + saved addresses
-- =============================================================================

-- Link customers to Supabase auth users
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);

-- =============================================================================
-- customer_addresses
-- Multiple saved delivery addresses per customer
-- =============================================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label        text        NOT NULL DEFAULT 'Home',
  address_line text        NOT NULL,
  lat          numeric(10,7),
  lng          numeric(10,7),
  is_default   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Enforce only one default per customer
CREATE UNIQUE INDEX IF NOT EXISTS customer_addresses_one_default_idx
  ON customer_addresses (customer_id)
  WHERE is_default = true;

-- =============================================================================
-- RLS for customers (auth-linked customers can read/edit their own row)
-- =============================================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Customers can read their own profile
DROP POLICY IF EXISTS "customer_read_own" ON customers;
CREATE POLICY "customer_read_own" ON customers
  FOR SELECT USING (auth.uid() = user_id);

-- Customers can update their own profile
DROP POLICY IF EXISTS "customer_update_own" ON customers;
CREATE POLICY "customer_update_own" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

-- Customers can insert their own profile (first login)
DROP POLICY IF EXISTS "customer_insert_own" ON customers;
CREATE POLICY "customer_insert_own" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- RLS for customer_addresses
-- =============================================================================
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_addresses_select_own" ON customer_addresses;
CREATE POLICY "customer_addresses_select_own" ON customer_addresses
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "customer_addresses_insert_own" ON customer_addresses;
CREATE POLICY "customer_addresses_insert_own" ON customer_addresses
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "customer_addresses_update_own" ON customer_addresses;
CREATE POLICY "customer_addresses_update_own" ON customer_addresses
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "customer_addresses_delete_own" ON customer_addresses;
CREATE POLICY "customer_addresses_delete_own" ON customer_addresses
  FOR DELETE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- =============================================================================
-- Allow customers to read their own orders for the tracking page
-- =============================================================================
DROP POLICY IF EXISTS "customer_read_own_orders" ON orders;
CREATE POLICY "customer_read_own_orders" ON orders
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );
