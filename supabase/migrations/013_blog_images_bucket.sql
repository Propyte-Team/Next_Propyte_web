-- Migration 013: create blog-images public bucket for cover images
-- Run in Supabase SQL Editor (proyecto oaijxdpevakashxshhvm)

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads
DROP POLICY IF EXISTS "blog_images_public_read" ON storage.objects;
CREATE POLICY "blog_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');
