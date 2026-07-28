ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS food_type text,
ADD COLUMN IF NOT EXISTS cuisine_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS prep_time_minutes integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS spice_level text,
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS discounted_price numeric(10,2),
ADD COLUMN IF NOT EXISTS dine_in_price numeric(10,2),
ADD COLUMN IF NOT EXISTS delivery_price numeric(10,2),
ADD COLUMN IF NOT EXISTS variant_groups jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS addon_groups jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS schedule_type text DEFAULT 'always',
ADD COLUMN IF NOT EXISTS schedule_slots jsonb DEFAULT '[]'::jsonb;
