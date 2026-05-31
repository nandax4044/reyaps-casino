-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add Image Storage for Wheel Prizes
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Create Storage Bucket for Wheel Prize Images ──────────────────────────

-- Create bucket (run this in Supabase Dashboard → Storage → Create Bucket)
-- Bucket name: wheel-images
-- Public: Yes
-- File size limit: 2MB
-- Allowed MIME types: image/png, image/jpeg, image/jpg, image/webp

-- Or create via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wheel-images',
  'wheel-images',
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Storage Policies ───────────────────────────────────────────────────────

-- Policy: Allow public read access to all images
CREATE POLICY "Public Access to Wheel Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'wheel-images');

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload wheel images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wheel-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow staff/admin to update images
CREATE POLICY "Staff can update wheel images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'wheel-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

-- Policy: Allow staff/admin to delete images
CREATE POLICY "Staff can delete wheel images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wheel-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

-- ─── 3. Create Additional Storage Buckets (Optional) ──────────────────────────

-- Bucket for case opening images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-images',
  'case-images',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for crash game images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crash-images',
  'crash-images',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for general game assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-assets',
  'game-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Policies for Additional Buckets ───────────────────────────────────────

-- Case Images Policies
CREATE POLICY "Public Access to Case Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'case-images');

CREATE POLICY "Authenticated users can upload case images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'case-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Staff can update case images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'case-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

CREATE POLICY "Staff can delete case images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'case-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

-- Crash Images Policies
CREATE POLICY "Public Access to Crash Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'crash-images');

CREATE POLICY "Authenticated users can upload crash images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crash-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Staff can update crash images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'crash-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

CREATE POLICY "Staff can delete crash images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'crash-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

-- Game Assets Policies
CREATE POLICY "Public Access to Game Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-assets');

CREATE POLICY "Staff can upload game assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'game-assets'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

CREATE POLICY "Staff can update game assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'game-assets'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

CREATE POLICY "Staff can delete game assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'game-assets'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

-- ─── 5. Create Helper Function for Image Upload ───────────────────────────────

-- Function to get public URL for uploaded image
CREATE OR REPLACE FUNCTION get_image_public_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url TEXT;
  public_url TEXT;
BEGIN
  -- Get Supabase project URL from environment
  base_url := current_setting('app.settings.supabase_url', true);
  
  IF base_url IS NULL THEN
    base_url := 'https://rwngqiakigebtwxohiri.supabase.co';
  END IF;
  
  -- Construct public URL
  public_url := base_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
  
  RETURN public_url;
END;
$$;

-- ─── 6. Create Image Metadata Table (Optional) ────────────────────────────────

-- Table to track uploaded images
CREATE TABLE IF NOT EXISTS public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  game_type TEXT, -- 'wheel', 'cases', 'crash', 'general'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bucket_name, file_path)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_uploaded_images_bucket ON public.uploaded_images(bucket_name);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_game_type ON public.uploaded_images(game_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_uploaded_by ON public.uploaded_images(uploaded_by);

-- RLS Policies for uploaded_images table
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view uploaded images metadata
CREATE POLICY "Anyone can view uploaded images"
ON public.uploaded_images FOR SELECT
USING (true);

-- Policy: Authenticated users can insert image metadata
CREATE POLICY "Authenticated users can insert image metadata"
ON public.uploaded_images FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Staff can update image metadata
CREATE POLICY "Staff can update image metadata"
ON public.uploaded_images FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

-- Policy: Staff can delete image metadata
CREATE POLICY "Staff can delete image metadata"
ON public.uploaded_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);

-- ─── 7. Create Trigger for Updated At ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_uploaded_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_uploaded_images_updated_at
BEFORE UPDATE ON public.uploaded_images
FOR EACH ROW
EXECUTE FUNCTION update_uploaded_images_updated_at();

-- ─── 8. Grant Permissions ──────────────────────────────────────────────────────

-- Grant access to uploaded_images table
GRANT ALL ON public.uploaded_images TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE!
-- ═══════════════════════════════════════════════════════════════════════════════

-- ✅ Storage buckets created:
--    - wheel-images (2MB limit, public)
--    - case-images (2MB limit, public)
--    - crash-images (2MB limit, public)
--    - game-assets (5MB limit, public)

-- ✅ Storage policies configured:
--    - Public read access
--    - Authenticated upload
--    - Staff update/delete

-- ✅ Helper function created:
--    - get_image_public_url()

-- ✅ Metadata table created:
--    - uploaded_images (track all uploads)

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEXT STEPS:
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify buckets created in Storage section
-- 3. Test upload from Admin Dashboard
-- 4. Check uploaded_images table for metadata

-- ═══════════════════════════════════════════════════════════════════════════════
-- USAGE EXAMPLE:
-- ═══════════════════════════════════════════════════════════════════════════════

-- Upload image via JavaScript:
/*
const { data, error } = await supabase.storage
  .from('wheel-images')
  .upload(`prizes/${Date.now()}_${file.name}`, file, {
    cacheControl: '3600',
    upsert: false
  });

if (data) {
  const publicUrl = supabase.storage
    .from('wheel-images')
    .getPublicUrl(data.path).data.publicUrl;
  
  console.log('Image uploaded:', publicUrl);
}
*/

-- Get public URL via SQL:
/*
SELECT get_image_public_url('wheel-images', 'prizes/1234567890_car.png');
*/

-- Query uploaded images:
/*
SELECT * FROM public.uploaded_images 
WHERE game_type = 'wheel' 
ORDER BY created_at DESC;
*/

-- ═══════════════════════════════════════════════════════════════════════════════
