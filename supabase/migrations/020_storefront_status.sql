-- Add storefront status columns
ALTER TABLE restaurants
ADD COLUMN is_accepting_orders boolean DEFAULT true,
ADD COLUMN announcement_message text;

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
  status
FROM restaurants;

-- Re-grant access
GRANT SELECT ON restaurants_public TO anon;
GRANT SELECT ON restaurants_public TO authenticated;
