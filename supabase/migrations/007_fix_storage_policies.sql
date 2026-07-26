-- Migration: 007_fix_storage_policies.sql
-- Fixes missing "public." schema prefix that caused DatabaseInvalidObjectDefinition 
-- in the storage schema, and allows platform_admins to upload onboarding images.

DROP POLICY IF EXISTS "menu-images: staff can insert/update/delete for their restaurant" ON storage.objects;

CREATE POLICY "menu-images: staff can insert/update/delete for their restaurant"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'menu-images' AND
    (string_to_array(name, '/'))[1] IN (
      SELECT restaurant_id::text 
      FROM public.restaurant_staff 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'menu-images' AND
    (string_to_array(name, '/'))[1] IN (
      SELECT restaurant_id::text 
      FROM public.restaurant_staff 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "menu-images: platform_admins have full access"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'menu-images' AND
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'menu-images' AND
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );
