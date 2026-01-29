-- ===================================================
-- FIX COMPLETO: Vouchers Table + Storage Policies
-- ===================================================
-- Ejecuta TODO este script en Supabase SQL Editor

-- ===================================================
-- PART 1: Fix TABLA vouchers RLS policies
-- ===================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "vouchers_select_policy" ON vouchers;
DROP POLICY IF EXISTS "vouchers_insert_policy" ON vouchers;
DROP POLICY IF EXISTS "vouchers_update_policy" ON vouchers;
DROP POLICY IF EXISTS "vouchers_delete_policy" ON vouchers;
DROP POLICY IF EXISTS "Enable read access for all users" ON vouchers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON vouchers;
DROP POLICY IF EXISTS "Enable update for users based on role" ON vouchers;

-- SELECT: Allow admins, operators to see all
CREATE POLICY "vouchers_select_policy"
ON vouchers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
  OR
  EXISTS (
    SELECT 1 FROM passengers
    WHERE passengers.profile_id = auth.uid()
    AND (
      passengers.id = vouchers.passenger_id
      OR (
        vouchers.trip_id IN (
          SELECT trip_id FROM trip_passengers WHERE passenger_id = passengers.id
        )
        AND vouchers.visibility = 'all_trip_passengers'
      )
    )
  )
);

-- INSERT: Only admins and operators
CREATE POLICY "vouchers_insert_policy"
ON vouchers FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
);

-- UPDATE: Only admins and operators
CREATE POLICY "vouchers_update_policy"
ON vouchers FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
);

-- DELETE: Only admins
CREATE POLICY "vouchers_delete_policy"
ON vouchers FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ===================================================
-- PART 2: Fix STORAGE bucket policies  
-- ===================================================

-- Drop existing storage policies for triex-vouchers
DROP POLICY IF EXISTS "vouchers_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "vouchers_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "vouchers_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "vouchers_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to read vouchers" ON storage.objects;

-- UPLOAD (INSERT): Admins and operators can upload to triex-vouchers
CREATE POLICY "vouchers_upload_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'triex-vouchers'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
);

-- SELECT: Admins, operators, and assigned passengers can view
CREATE POLICY "vouchers_select_policy_storage"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'triex-vouchers'
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'operator')
    )
    OR
    -- Passengers can see vouchers from their trips
    EXISTS (
      SELECT 1 FROM passengers
      JOIN trip_passengers ON trip_passengers.passenger_id = passengers.id
      JOIN vouchers ON vouchers.trip_id = trip_passengers.trip_id
      WHERE passengers.profile_id = auth.uid()
      AND storage.objects.name LIKE 'trips/' || trip_passengers.trip_id || '%'
    )
  )
);

-- UPDATE: Only admins and operators
CREATE POLICY "vouchers_update_policy_storage"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'triex-vouchers'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
);

-- DELETE: Only admins and operators
CREATE POLICY "vouchers_delete_policy_storage"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'triex-vouchers'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
);

-- ===================================================
-- VERIFICATION
-- ===================================================

-- 1. Check your role (should be admin or operator)
-- SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- 2. Test voucher creation
-- INSERT INTO vouchers (type_id, title, format, visibility, status) 
-- VALUES ((SELECT id FROM voucher_types LIMIT 1), 'Test Voucher', 'link', 'passenger_only', 'active');

-- 3. List all policies
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'vouchers';
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND bucket_id = 'triex-vouchers';
