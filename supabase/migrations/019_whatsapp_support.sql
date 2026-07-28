-- Add whatsapp_number column to restaurants
ALTER TABLE restaurants
ADD COLUMN whatsapp_number text;

-- Drop the view because we are modifying the underlying table columns that we want to select
DROP VIEW IF EXISTS restaurants_public;

-- Recreate the view with whatsapp_number
CREATE VIEW restaurants_public AS
SELECT 
  id,
  name,
  domain,
  subdomain,
  logo_url,
  banner_image_url,
  primary_color,
  font_family,
  address,
  lat,
  lng,
  delivery_radius_km,
  is_cod_enabled,
  is_online_payment_enabled,
  whatsapp_number,
  status
FROM restaurants;

-- Re-grant access
GRANT SELECT ON restaurants_public TO anon;
GRANT SELECT ON restaurants_public TO authenticated;
