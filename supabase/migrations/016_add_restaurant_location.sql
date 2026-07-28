-- =============================================================================
-- Migration: 002_add_restaurant_location.sql
-- Description: Adds location and delivery radius configuration to restaurants
-- =============================================================================

ALTER TABLE restaurants
  ADD COLUMN address text,
  ADD COLUMN lat numeric,
  ADD COLUMN lng numeric,
  ADD COLUMN delivery_radius_km numeric;

COMMENT ON COLUMN restaurants.address IS 'Physical address of the restaurant';
COMMENT ON COLUMN restaurants.lat IS 'Latitude coordinate for the restaurant location';
COMMENT ON COLUMN restaurants.lng IS 'Longitude coordinate for the restaurant location';
COMMENT ON COLUMN restaurants.delivery_radius_km IS 'Delivery radius in kilometers. Orders outside this radius are rejected.';

-- Update the public view so storefronts can compute delivery boundaries
CREATE OR REPLACE VIEW restaurants_public AS
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
    delivery_radius_km
  FROM restaurants
  WHERE status = 'active';
