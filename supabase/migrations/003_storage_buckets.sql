-- =============================================================================
-- Migration: 003_storage_buckets.sql
-- Creates the `menu-images` bucket and configures RLS policies so staff can
-- upload/delete images for their own restaurants, and the public can view them.
-- =============================================================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true, -- Publicly readable so the storefront can render images without auth tokens
  2097152, -- 2MB limit in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS Policies for storage.objects

-- Allow public read access to all objects in the bucket
CREATE POLICY "menu-images: public can read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'menu-images');

-- Allow authenticated staff to upload/delete images.
-- We enforce that the file path starts with the restaurant_id to keep tenants isolated.
-- For example: 'menu-images/1234-abcd/burger.jpg'
-- auth.uid() must map to that restaurant_id in the restaurant_staff table.
CREATE POLICY "menu-images: staff can insert/update/delete for their restaurant"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'menu-images' AND
    -- Extract the first folder name from the path (which should be the restaurant_id)
    (string_to_array(name, '/'))[1] IN (
      SELECT restaurant_id::text 
      FROM restaurant_staff 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'menu-images' AND
    (string_to_array(name, '/'))[1] IN (
      SELECT restaurant_id::text 
      FROM restaurant_staff 
      WHERE user_id = auth.uid()
    )
  );

-- Note: We use string_to_array(name, '/')[1] because storage.objects.name contains 
-- the full path inside the bucket (e.g. "a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx/image.jpg")
