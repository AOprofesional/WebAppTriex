-- Complete Vouchers RLS Fix
-- Execute this in Supabase SQL Editor (Table Editor → vouchers → RLS tab or SQL Editor)

-- ===================================================
-- STEP 1: Drop ALL existing policies on vouchers
-- ===================================================
DROP POLICY IF EXISTS "vouchers_select_policy" ON vouchers;
DROP POLICY IF EXISTS "vouchers_insert_policy" ON vouchers;
DROP POLICY IF EXISTS "vouchers_update_policy" ON vouchers;
DROP POLICY IF EXISTS "vouchers_delete_policy" ON vouchers;
DROP POLICY IF EXISTS "Enable read access for all users" ON vouchers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON vouchers;
DROP POLICY IF EXISTS "Enable update for users based on role" ON vouchers;

-- ===================================================
-- STEP 2: Create comprehensive policies
-- ===================================================

-- SELECT: Allow admins, operators to see all vouchers
-- Passengers can only see their own vouchers
CREATE POLICY "vouchers_select_policy"
ON vouchers
FOR SELECT
TO authenticated
USING (
  -- Admins and operators can see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
  OR
  -- Passengers can only see vouchers assigned to them or their trips
  EXISTS (
    SELECT 1 FROM passengers
    WHERE passengers.profile_id = auth.uid()
    AND (
      passengers.id = vouchers.passenger_id
      OR (
        vouchers.trip_id IN (
          SELECT trip_id FROM trip_passengers
          WHERE passenger_id = passengers.id
        )
        AND vouchers.visibility = 'all_trip_passengers'
      )
    )
  )
);

-- INSERT: Only admins and operators can create vouchers
CREATE POLICY "vouchers_insert_policy"
ON vouchers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
);

-- UPDATE: Only admins and operators can update vouchers
CREATE POLICY "vouchers_update_policy"
ON vouchers
FOR UPDATE
TO authenticated
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

-- DELETE: Only admins can delete (though we use soft delete)
CREATE POLICY "vouchers_delete_policy"
ON vouchers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ===================================================
-- VERIFICATION QUERIES (run these to check)
-- ===================================================

-- 1. Check your current user role
-- SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- 2. List all policies on vouchers table
-- SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'vouchers';

-- 3. Test INSERT permission (should work if you're admin/operator)
-- INSERT INTO vouchers (trip_id, type_id, title, format, visibility, status) VALUES (null, (SELECT id FROM voucher_types LIMIT 1), 'Test Voucher', 'link', 'passenger_only', 'active');
