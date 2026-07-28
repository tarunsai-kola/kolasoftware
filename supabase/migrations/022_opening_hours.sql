-- Add opening and closing times
ALTER TABLE restaurants
ADD COLUMN opening_time TIME DEFAULT '09:00:00',
ADD COLUMN closing_time TIME DEFAULT '22:00:00';

-- Drop view to recreate it
DROP VIEW IF EXISTS restaurants_public;

-- Recreate the view with the new columns
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
  is_accepting_orders,
  announcement_message,
  opening_time,
  closing_time,
  status
FROM restaurants;

-- Re-grant access
GRANT SELECT ON restaurants_public TO anon;
GRANT SELECT ON restaurants_public TO authenticated;
