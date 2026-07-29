-- =============================================================================
-- Migration: 024_add_category_order.sql
-- Description: Adds category_order to restaurants to support drag-and-drop category sorting
-- =============================================================================

ALTER TABLE restaurants
  ADD COLUMN category_order text[] DEFAULT '{}';

COMMENT ON COLUMN restaurants.category_order IS 'Array of category names representing the custom order of categories for this restaurant.';

-- Update the public view so storefronts can compute category order
CREATE OR REPLACE VIEW restaurants_public WITH (security_invoker = on) AS
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
    address,
    lat,
    lng,
    delivery_radius_km,
    category_order
  FROM restaurants
  WHERE status = 'active';
