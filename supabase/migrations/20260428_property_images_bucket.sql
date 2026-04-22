-- Create public storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'property_images_public_read' AND tablename = 'objects') THEN
    CREATE POLICY "property_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'property_images_insert' AND tablename = 'objects') THEN
    CREATE POLICY "property_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'property_images_delete' AND tablename = 'objects') THEN
    CREATE POLICY "property_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'property-images');
  END IF;
END $$;
