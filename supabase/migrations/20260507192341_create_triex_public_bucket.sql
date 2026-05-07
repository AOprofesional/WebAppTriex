-- Create a new bucket called 'triex-public'
INSERT INTO storage.buckets (id, name, public)
VALUES ('triex-public', 'triex-public', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files
CREATE POLICY "Public Access triex-public"
ON storage.objects FOR SELECT
USING ( bucket_id = 'triex-public' );

-- Allow authenticated admins to upload files
CREATE POLICY "Admin Upload Access triex-public"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'triex-public' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Allow authenticated admins to update files
CREATE POLICY "Admin Update Access triex-public"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'triex-public' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Allow authenticated admins to delete files
CREATE POLICY "Admin Delete Access triex-public"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'triex-public' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);
