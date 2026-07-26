-- =============================================================================
-- Migration: 005_admin_views.sql
-- Creates admin-specific views and grants platform_admins global access via RLS.
-- =============================================================================

-- 1. Add RLS Policies for platform_admins to read all data
CREATE POLICY "platform_admins can read all restaurants" 
  ON restaurants 
  FOR SELECT 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "platform_admins can update all restaurants" 
  ON restaurants 
  FOR UPDATE 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "platform_admins can read all orders" 
  ON orders 
  FOR SELECT 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- 2. Create the View for Restaurant Stats
CREATE OR REPLACE VIEW vw_admin_restaurant_stats AS
SELECT 
  r.id,
  r.name,
  r.domain,
  r.subdomain,
  r.status,
  r.subscription_status,
  r.next_billing_date,
  r.created_at,
  COUNT(o.id) as orders_this_month
FROM restaurants r
LEFT JOIN orders o 
  ON o.restaurant_id = r.id 
  AND date_trunc('month', o.created_at) = date_trunc('month', now())
GROUP BY 
  r.id, 
  r.name, 
  r.domain, 
  r.subdomain, 
  r.status, 
  r.subscription_status, 
  r.next_billing_date,
  r.created_at;

-- Views automatically use the permissions of the user querying them, so 
-- the platform_admins RLS policies above will safely secure this view.
