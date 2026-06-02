-- ==============================================================================
-- Migration: Setup trip-banners Storage Bucket
-- Description: Creates the trip-banners bucket and configures RLS policies
-- ==============================================================================

-- 1. Create the 'trip-banners' bucket if it doesn't exist (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'trip-banners', 
    'trip-banners', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- Storage RLS Policies for trip-banners
-- ==============================================================================

-- Enable RLS on storage.objects just in case (usually already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to read trip banners
CREATE POLICY "Public can view trip banners" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'trip-banners');

-- Allow authenticated users (admins) to insert/upload trip banners
CREATE POLICY "Authenticated users can upload trip banners" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'trip-banners');

-- Allow authenticated users to update trip banners
CREATE POLICY "Authenticated users can update trip banners" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'trip-banners');

-- Allow authenticated users to delete trip banners
CREATE POLICY "Authenticated users can delete trip banners" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'trip-banners');
