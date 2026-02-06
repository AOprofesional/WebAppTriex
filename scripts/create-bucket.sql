-- Create trip-banners bucket for storing trip banner images
-- Run this in Supabase SQL Editor

-- Insert bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-banners',
  'trip-banners',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'trip-banners' );

-- Create policy for authenticated uploads
CREATE POLICY "Authenticated users can upload trip banners"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'trip-banners' 
  AND auth.role() = 'authenticated'
);

-- Create policy for authenticated updates
CREATE POLICY "Authenticated users can update trip banners"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'trip-banners' 
  AND auth.role() = 'authenticated'
);

-- Create policy for authenticated deletes
CREATE POLICY "Authenticated users can delete trip banners"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'trip-banners' 
  AND auth.role() = 'authenticated'
);
