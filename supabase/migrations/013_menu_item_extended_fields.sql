ALTER TABLE menu_items
ADD COLUMN food_type text,
ADD COLUMN cuisine_tags text[] DEFAULT '{}',
ADD COLUMN prep_time_minutes integer DEFAULT 15,
ADD COLUMN spice_level text,
ADD COLUMN sku text,
ADD COLUMN discounted_price numeric(10,2),
ADD COLUMN dine_in_price numeric(10,2),
ADD COLUMN delivery_price numeric(10,2),
ADD COLUMN variant_groups jsonb DEFAULT '[]'::jsonb,
ADD COLUMN addon_groups jsonb DEFAULT '[]'::jsonb,
ADD COLUMN schedule_type text DEFAULT 'always',
ADD COLUMN schedule_slots jsonb DEFAULT '[]'::jsonb;
