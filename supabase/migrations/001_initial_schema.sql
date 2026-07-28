-- =============================================================================
-- Migration: 001_initial_schema.sql
-- Platform: Multi-tenant restaurant ordering SaaS
-- =============================================================================
-- Execution order matters:
--   1. Tables (dependencies first: restaurants before restaurant_staff, etc.)
--   2. Indexes
--   3. Public view (restaurants_public)
--   4. Enable RLS on all tables
--   5. RLS policies (per table)
-- =============================================================================


-- =============================================================================
-- SECTION 1: TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- restaurants
-- One row per tenant. The domain/subdomain columns drive middleware routing.
-- Theme columns (primary_color, font_family, etc.) are injected via headers
-- by middleware so every page can apply branding without extra DB calls.
-- -----------------------------------------------------------------------------
CREATE TABLE restaurants (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  domain               text        UNIQUE NOT NULL,   -- e.g. "spicehouse.com"
  subdomain            text        UNIQUE NOT NULL,   -- e.g. "spicehouse" → spicehouse.kolasolution.com
  logo_url             text,
  primary_color        text        NOT NULL DEFAULT '#D85A30',
  font_family          text        NOT NULL DEFAULT 'Inter',
  banner_image_url     text,
  kitchen_email        text        NOT NULL,          -- new order notifications go here
  owner_id             uuid        REFERENCES auth.users ON DELETE SET NULL,
  status               text        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active', 'suspended', 'pending_setup')),
  subscription_status  text        NOT NULL DEFAULT 'trialing'
                                   CHECK (subscription_status IN ('trialing', 'active', 'overdue', 'cancelled')),
  next_billing_date    date,
  created_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE restaurants IS
  'One row per tenant restaurant. domain/subdomain used by middleware for tenant resolution. '
  'Theme columns drive runtime branding. Never hardcode per-restaurant values in app code.';

COMMENT ON COLUMN restaurants.domain IS
  'Full custom domain the restaurant owns, e.g. spicehouse.com. Used by middleware for tenant lookup.';

COMMENT ON COLUMN restaurants.subdomain IS
  'Platform subdomain slug, e.g. "spicehouse" → spicehouse.kolasolution.com. Fallback when no custom domain.';

COMMENT ON COLUMN restaurants.owner_id IS
  'The Supabase auth user who owns this restaurant. Also present in restaurant_staff with role=owner.';

-- -----------------------------------------------------------------------------
-- platform_admins
-- Super-admin users who can manage all restaurants, billing, and onboarding.
-- Checked by RLS helper function is_platform_admin().
-- -----------------------------------------------------------------------------
CREATE TABLE platform_admins (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users ON DELETE CASCADE UNIQUE NOT NULL,
  role       text        NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE platform_admins IS
  'Platform super-admins. RLS policies check this table via is_platform_admin() helper. '
  'Never grant platform_admin access via restaurant_staff — keep them separate.';

-- -----------------------------------------------------------------------------
-- restaurant_staff
-- Maps Supabase auth users to restaurants with a role.
-- RLS policies use this table to scope data access per restaurant.
-- The unique constraint ensures one user cannot have two staff rows for
-- the same restaurant (though they CAN be staff at multiple restaurants).
-- -----------------------------------------------------------------------------
CREATE TABLE restaurant_staff (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid        NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role          text        NOT NULL DEFAULT 'staff'
                            CHECK (role IN ('owner', 'staff')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, user_id)
);

COMMENT ON TABLE restaurant_staff IS
  'Joins auth users to restaurants. RLS on all tenant tables uses EXISTS queries '
  'against this table to verify that a user belongs to the restaurant in question.';

-- -----------------------------------------------------------------------------
-- menu_items
-- Belongs to a restaurant. Public can read is_available items for storefront.
-- The items JSONB column in orders snapshots this data at order time so
-- menu changes do not retroactively alter historical orders.
-- -----------------------------------------------------------------------------
CREATE TABLE menu_items (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid           NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  name          text           NOT NULL,
  description   text,
  price         numeric(10,2)  NOT NULL,
  category      text           NOT NULL,
  image_url     text,
  is_available  boolean        NOT NULL DEFAULT true,
  sort_order    integer        NOT NULL DEFAULT 0,
  created_at    timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE menu_items IS
  'Restaurant menu. is_available controls storefront visibility. '
  'Prices are snapshotted into order_items.price_at_order at checkout.';

-- -----------------------------------------------------------------------------
-- customers
-- Phone-identified, no Supabase Auth required. One global row per phone number
-- across the whole platform — restaurants share the customer pool but can only
-- see customers who have ordered from them (enforced by RLS).
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      text        NOT NULL UNIQUE,
  email      text,
  name       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE customers IS
  'Phone-identified customers. No login required. Global across the platform; '
  'RLS restricts restaurant_staff to only seeing customers from their own restaurant.';

-- -----------------------------------------------------------------------------
-- orders
-- Core business table. items JSONB stores a snapshot of ordered items so the
-- order record remains accurate even if menu items are later edited or deleted.
-- restaurant_id enables direct RLS scoping without joining order_items.
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    uuid           NOT NULL REFERENCES restaurants ON DELETE RESTRICT,
  customer_id      uuid           NOT NULL REFERENCES customers ON DELETE RESTRICT,
  items            jsonb          NOT NULL,              -- snapshot: [{id, name, qty, price}]
  total_amount     numeric(10,2)  NOT NULL,
  status           text           NOT NULL DEFAULT 'new'
                                  CHECK (status IN ('new', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status   text           NOT NULL DEFAULT 'pending'
                                  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id       text,                                 -- Razorpay payment ID, set by webhook
  delivery_type    text           NOT NULL
                                  CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address text,                                 -- required when delivery_type = 'delivery'
  customer_email   text,                                 -- optional, for email receipts
  acknowledged_at  timestamptz,                          -- set when kitchen staff first sees the order
  created_at       timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE orders IS
  'Every customer order. items is a JSONB snapshot at checkout time. '
  'payment_id is set by the Razorpay webhook after successful capture. '
  'acknowledged_at is set by dashboard when staff open/confirm a new order.';

COMMENT ON COLUMN orders.items IS
  'Snapshot of cart at order time: [{menu_item_id, name, quantity, price_at_order}]. '
  'Immutable after creation — do not update this column.';

-- -----------------------------------------------------------------------------
-- order_items
-- Normalised line items mirroring the orders.items JSONB snapshot.
-- item_name and price_at_order are denormalised so the record is accurate
-- even if the menu item is later modified or deleted.
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid           NOT NULL REFERENCES orders ON DELETE CASCADE,
  menu_item_id     uuid           REFERENCES menu_items ON DELETE SET NULL, -- nullable: item may be deleted
  item_name        text           NOT NULL,             -- snapshot, never rely on joining menu_items
  quantity         integer        NOT NULL CHECK (quantity > 0),
  price_at_order   numeric(10,2)  NOT NULL
);

COMMENT ON TABLE order_items IS
  'Normalised line items for each order. item_name and price_at_order are snapshots. '
  'menu_item_id may be NULL if the item was deleted after the order was placed.';

-- -----------------------------------------------------------------------------
-- billing_payments
-- Platform subscription payment records (₹2,000/month per restaurant).
-- This is NOT customer payment data — that lives in orders.payment_id.
-- Only platform_admins can read or write this table.
-- -----------------------------------------------------------------------------
CREATE TABLE billing_payments (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid           NOT NULL REFERENCES restaurants ON DELETE RESTRICT,
  amount        numeric(10,2)  NOT NULL DEFAULT 2000,
  status        text           NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at       timestamptz,
  period_start  date           NOT NULL,
  period_end    date           NOT NULL,
  created_at    timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE billing_payments IS
  'Platform subscription billing records (₹2,000/month). '
  'Completely separate from order payments which go directly to restaurants. '
  'Readable only by platform_admins via RLS.';


-- =============================================================================
-- SECTION 2: INDEXES
-- =============================================================================

-- Unique indexes on restaurants (redundant with UNIQUE constraints but explicit
-- for documentation and query-planner visibility)
CREATE UNIQUE INDEX idx_restaurants_domain    ON restaurants (domain);
CREATE UNIQUE INDEX idx_restaurants_subdomain ON restaurants (subdomain);

-- orders — the most-queried table on the dashboard; index restaurant_id and
-- created_at separately and together for common "orders today" queries
CREATE INDEX idx_orders_restaurant_id         ON orders (restaurant_id);
CREATE INDEX idx_orders_created_at            ON orders (created_at DESC);
CREATE INDEX idx_orders_restaurant_created    ON orders (restaurant_id, created_at DESC);
CREATE INDEX idx_orders_status                ON orders (restaurant_id, status)
  WHERE status NOT IN ('completed', 'cancelled');  -- partial index: active orders only

-- menu_items — storefront loads the full menu on every page; keep this fast
CREATE INDEX idx_menu_items_restaurant_id     ON menu_items (restaurant_id);
CREATE INDEX idx_menu_items_available         ON menu_items (restaurant_id, is_available, sort_order);

-- customers — phone lookup at checkout
CREATE UNIQUE INDEX idx_customers_phone       ON customers (phone);

-- restaurant_staff — frequently checked in RLS EXISTS subqueries
CREATE INDEX idx_restaurant_staff_user_id     ON restaurant_staff (user_id);
CREATE INDEX idx_restaurant_staff_restaurant  ON restaurant_staff (restaurant_id);

-- order_items — joined to orders for receipts and analytics
CREATE INDEX idx_order_items_order_id         ON order_items (order_id);

-- billing_payments
CREATE INDEX idx_billing_restaurant_id        ON billing_payments (restaurant_id);


-- =============================================================================
-- SECTION 3: PUBLIC VIEW (restaurants_public)
-- Exposes only storefront-safe columns of the restaurants table.
-- Excludes: owner_id, kitchen_email, subscription_status, next_billing_date.
-- Used by unauthenticated storefront requests to load branding/name without
-- leaking internal/billing data.
-- =============================================================================

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
    status
  FROM restaurants
  WHERE status = 'active';

COMMENT ON VIEW restaurants_public IS
  'Safe public view of restaurants — excludes owner_id, kitchen_email, and billing columns. '
  'Use this view in storefront queries; never SELECT * FROM restaurants in public-facing code.';


-- =============================================================================
-- SECTION 4: RLS HELPER FUNCTIONS
-- Defined before policies to keep policy expressions readable.
-- =============================================================================

-- Returns true if the current JWT user is a platform admin.
-- Called in most RLS policies as the super-access escape hatch.
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER   -- runs as the function owner (bypasses RLS on platform_admins)
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM platform_admins
    WHERE user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION is_platform_admin() IS
  'Returns true if the current auth user exists in platform_admins. '
  'SECURITY DEFINER so it can read platform_admins even with RLS enabled. '
  'Used in all RLS policies as the admin escape hatch.';

-- Returns the restaurant_id(s) the current user is staff for.
-- Used in EXISTS subqueries within RLS policies.
CREATE OR REPLACE FUNCTION get_my_restaurant_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT restaurant_id
  FROM restaurant_staff
  WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION get_my_restaurant_ids() IS
  'Returns all restaurant_ids the current user is staff for. '
  'Used in RLS policies for multi-restaurant staff (unlikely but supported).';


-- =============================================================================
-- SECTION 5: ENABLE ROW LEVEL SECURITY
-- Must be enabled on every table before policies are added.
-- =============================================================================

ALTER TABLE restaurants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_staff   ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payments   ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 6: RLS POLICIES
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: restaurants
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy: Platform admins have full access to all restaurant rows.
CREATE POLICY "restaurants: platform_admins have full access"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Policy: Restaurant staff can read the row for their own restaurant only.
-- Needed so dashboard layouts can load their restaurant's branding + settings.
CREATE POLICY "restaurants: staff can read their own restaurant"
  ON restaurants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurants.id
        AND rs.user_id = auth.uid()
    )
  );

-- Policy: Restaurant owners (role = 'owner') can update their own restaurant row.
-- Allows them to change branding, kitchen_email, etc. but not owner_id or status.
-- Column-level restrictions are enforced in the application layer.
CREATE POLICY "restaurants: owners can update their own restaurant"
  ON restaurants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurants.id
        AND rs.user_id = auth.uid()
        AND rs.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurants.id
        AND rs.user_id = auth.uid()
        AND rs.role = 'owner'
    )
  );

-- Policy: Unauthenticated (anon) users can read a safe subset of restaurant data.
-- This is needed by middleware/storefront to resolve branding by domain/subdomain.
-- The restaurants_public VIEW (section 3) further limits which columns are exposed.
-- Only active restaurants are visible.
CREATE POLICY "restaurants: public can read active restaurants"
  ON restaurants
  FOR SELECT
  TO anon
  USING (status = 'active');


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: platform_admins
-- Only platform admins can read/write this table. No public or staff access.
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy: Admins can read and manage the admins table.
-- Combined USING + WITH CHECK so admins can insert new admins.
CREATE POLICY "platform_admins: admins only"
  ON platform_admins
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: restaurant_staff
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy: Platform admins can do everything.
CREATE POLICY "restaurant_staff: platform_admins have full access"
  ON restaurant_staff
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Policy: Staff can see other staff members at their own restaurant.
-- Needed for "Manage Team" screens in the dashboard.
CREATE POLICY "restaurant_staff: staff can view colleagues at same restaurant"
  ON restaurant_staff
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_staff.restaurant_id
        AND rs.user_id = auth.uid()
    )
  );

-- Policy: Owners can add/remove staff from their own restaurant.
CREATE POLICY "restaurant_staff: owners can manage staff for their restaurant"
  ON restaurant_staff
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_staff.restaurant_id
        AND rs.user_id = auth.uid()
        AND rs.role = 'owner'
    )
  );

CREATE POLICY "restaurant_staff: owners can delete staff from their restaurant"
  ON restaurant_staff
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_staff.restaurant_id
        AND rs.user_id = auth.uid()
        AND rs.role = 'owner'
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: menu_items
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy: Unauthenticated users can read available menu items for any restaurant.
-- Required by the storefront to render the menu without a login.
CREATE POLICY "menu_items: public can read available items"
  ON menu_items
  FOR SELECT
  TO anon
  USING (is_available = true);

-- Policy: Authenticated (but not staff or admin) users can also read available items.
-- Covers the case where a customer somehow has a session.
CREATE POLICY "menu_items: authenticated can read available items"
  ON menu_items
  FOR SELECT
  TO authenticated
  USING (is_available = true);

-- Policy: Restaurant staff can read ALL items for their restaurant
-- (including unavailable ones, needed for menu management dashboard).
CREATE POLICY "menu_items: staff can read all items for their restaurant"
  ON menu_items
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (SELECT get_my_restaurant_ids())
  );

-- Policy: Restaurant staff can insert, update, and delete menu items
-- for their own restaurant.
CREATE POLICY "menu_items: staff can manage items for their restaurant"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT get_my_restaurant_ids())
  )
  WITH CHECK (
    restaurant_id IN (SELECT get_my_restaurant_ids())
  );

-- Policy: Platform admins can do everything on menu_items.
CREATE POLICY "menu_items: platform_admins have full access"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: customers
-- Global table — one row per phone number across the whole platform.
-- Customers identify themselves by phone at checkout (no Supabase Auth).
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy: Unauthenticated users can insert a new customer row at checkout.
-- The unique constraint on phone handles deduplication (upsert in app code).
CREATE POLICY "customers: public can insert (checkout flow)"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Unauthenticated users can look up their own customer row by phone.
-- Used at checkout to pre-fill name/email if they've ordered before.
-- Restricts SELECT to only the row matching the provided phone — enforced
-- in application code via .eq('phone', userProvidedPhone).
-- Note: RLS cannot filter on function args; app must pass phone explicitly.
CREATE POLICY "customers: public can read own row by phone"
  ON customers
  FOR SELECT
  TO anon
  USING (true);
  -- ⚠️ This is intentionally permissive for anon reads.
  -- Restrict in app code: always .eq('phone', ...) — never .select('*') without a phone filter.
  -- Consider tightening this with a Postgres session variable if your threat model requires it.

-- Policy: Restaurant staff can read customers who have placed at least one
-- order at their restaurant. Prevents staff from browsing the global customer list.
CREATE POLICY "customers: staff can read customers who ordered from their restaurant"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.customer_id = customers.id
        AND o.restaurant_id IN (SELECT get_my_restaurant_ids())
    )
  );

-- Policy: Platform admins have full read access to customers.
CREATE POLICY "customers: platform_admins have full access"
  ON customers
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: orders
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy: Unauthenticated users can INSERT a new order at checkout.
-- Application code must set restaurant_id, customer_id, items, total_amount,
-- delivery_type. status and payment_status should default; never trust client.
CREATE POLICY "orders: public can insert (checkout)"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Ensure only valid delivery types are accepted
    delivery_type IN ('delivery', 'pickup')
    -- Ensure the restaurant exists and is active
    AND EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = restaurant_id
        AND r.status = 'active'
    )
  );

-- Policy: Unauthenticated users can read their own orders by customer_id.
-- Used on the "Track Order" page where customers enter their phone.
-- App code must resolve customer_id from phone before querying.
CREATE POLICY "orders: public can read own orders"
  ON orders
  FOR SELECT
  TO anon
  USING (true);
  -- ⚠️ Same note as customers: restrict in app code via .eq('customer_id', resolvedId).

-- Policy: Restaurant staff can read all orders for their restaurant.
-- Core dashboard functionality.
CREATE POLICY "orders: staff can read orders for their restaurant"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (SELECT get_my_restaurant_ids())
  );

-- Policy: Restaurant staff can update order status (new → preparing → ready →
-- completed/cancelled) and set acknowledged_at. They cannot change restaurant_id,
-- customer_id, items, total_amount, or payment columns.
-- Column-level restrictions are reinforced in the application layer.
CREATE POLICY "orders: staff can update status for their restaurant's orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (SELECT get_my_restaurant_ids())
  )
  WITH CHECK (
    restaurant_id IN (SELECT get_my_restaurant_ids())
  );

-- Policy: Razorpay webhooks (called via service role from API route) update
-- payment_status and payment_id. Service role bypasses RLS, no policy needed.
-- This comment documents the intended access pattern for payment updates.

-- Policy: Platform admins can read all orders across all restaurants.
CREATE POLICY "orders: platform_admins have full access"
  ON orders
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: order_items
-- Scoped via the parent order's restaurant_id (requires joining orders).
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy: Unauthenticated users can insert order_items as part of checkout.
-- The parent order must already exist and belong to the same restaurant.
CREATE POLICY "order_items: public can insert at checkout"
  ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
    )
  );

-- Policy: Unauthenticated users can read their own order items.
CREATE POLICY "order_items: public can read own order items"
  ON order_items
  FOR SELECT
  TO anon
  USING (true);
  -- ⚠️ App code must always join via order_id; never expose without a filter.

-- Policy: Restaurant staff can read order_items for orders from their restaurant.
CREATE POLICY "order_items: staff can read for their restaurant's orders"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.restaurant_id IN (SELECT get_my_restaurant_ids())
    )
  );

-- Policy: Platform admins have full access.
CREATE POLICY "order_items: platform_admins have full access"
  ON order_items
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: billing_payments
-- Platform subscription payments. Only platform_admins can access this table.
-- No restaurant_staff or public access — ever.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "billing_payments: platform_admins only"
  ON billing_payments
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());


-- =============================================================================
-- SECTION 7: REALTIME
-- Enable Supabase Realtime on the orders table so kitchen dashboards receive
-- live INSERT/UPDATE events without polling.
-- =============================================================================

-- Add orders to the supabase_realtime publication.
-- Only orders is needed for real-time kitchen updates.
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

COMMENT ON TABLE orders IS
  'Core order table. Added to supabase_realtime publication — '
  'kitchen dashboards subscribe to restaurant_id-filtered channels for live updates.';


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
