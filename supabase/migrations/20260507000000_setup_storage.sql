-- ==============================================================================
-- Migration: Setup Storage Buckets for Vouchers and Documents
-- Description: Ensures the required storage buckets exist in self-hosted environments
--              and configures the appropriate RLS policies for storage.objects.
-- ==============================================================================

-- 1. Create the 'triex-vouchers' bucket if it doesn't exist (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'triex-vouchers', 
    'triex-vouchers', 
    false, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the 'triex-documents' bucket if it doesn't exist (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'triex-documents', 
    'triex-documents', 
    false, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- Storage RLS Policies
-- ==============================================================================

-- Enable RLS on storage.objects just in case
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- triex-vouchers Policies
-- --------------------------------------------------------

-- Allow authenticated users to insert/upload vouchers
CREATE POLICY "Authenticated users can upload vouchers" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'triex-vouchers');

-- Allow authenticated users to read vouchers
CREATE POLICY "Authenticated users can read vouchers" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'triex-vouchers');

-- Allow authenticated users to update vouchers
CREATE POLICY "Authenticated users can update vouchers" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'triex-vouchers');

-- Allow authenticated users to delete vouchers
CREATE POLICY "Authenticated users can delete vouchers" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'triex-vouchers');

-- --------------------------------------------------------
-- triex-documents Policies
-- --------------------------------------------------------

-- Allow authenticated users to insert/upload documents
CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'triex-documents');

-- Allow authenticated users to read documents
CREATE POLICY "Authenticated users can read documents" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'triex-documents');

-- Allow authenticated users to update documents
CREATE POLICY "Authenticated users can update documents" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'triex-documents');

-- Allow authenticated users to delete documents
CREATE POLICY "Authenticated users can delete documents" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'triex-documents');
