-- Fix Vouchers RLS Policies - Allow INSERT for Admin/Operator
-- Execute this in Supabase SQL Editor

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "vouchers_insert_policy" ON vouchers;

-- Create new INSERT policy for admins and operators
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

-- Also ensure UPDATE policy exists for admins/operators
DROP POLICY IF EXISTS "vouchers_update_policy" ON vouchers;

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
