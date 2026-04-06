-- Migration: 20260406160000_audit_rls_strict.sql
-- Description: Implement strict RLS policies to prevent direct deletions from client.
-- Replaces default full access with explicit policies that OMIT DELETE operations.

-- Enable Row Level Security (Implicitly blocks ALL operations without a matching policy)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- TRIPS
-- --------------------------------------------------------
CREATE POLICY "Trips Read Access" ON trips FOR SELECT USING (true);
CREATE POLICY "Trips Insert Access" ON trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Trips Update Access" ON trips FOR UPDATE USING (true) WITH CHECK (true);
-- NOTE: No DELETE policy to block client-side deletions

-- --------------------------------------------------------
-- TRIP PASSENGERS
-- --------------------------------------------------------
CREATE POLICY "Trip Passengers Read Access" ON trip_passengers FOR SELECT USING (true);
CREATE POLICY "Trip Passengers Insert Access" ON trip_passengers FOR INSERT WITH CHECK (true);
CREATE POLICY "Trip Passengers Update Access" ON trip_passengers FOR UPDATE USING (true) WITH CHECK (true);
-- NOTE: No DELETE policy to block client-side deletions

-- --------------------------------------------------------
-- VOUCHERS
-- --------------------------------------------------------
CREATE POLICY "Vouchers Read Access" ON vouchers FOR SELECT USING (true);
CREATE POLICY "Vouchers Insert Access" ON vouchers FOR INSERT WITH CHECK (true);
CREATE POLICY "Vouchers Update Access" ON vouchers FOR UPDATE USING (true) WITH CHECK (true);
-- NOTE: No DELETE policy to block client-side deletions

-- --------------------------------------------------------
-- PASSENGERS
-- --------------------------------------------------------
CREATE POLICY "Passengers Read Access" ON passengers FOR SELECT USING (true);
CREATE POLICY "Passengers Insert Access" ON passengers FOR INSERT WITH CHECK (true);
CREATE POLICY "Passengers Update Access" ON passengers FOR UPDATE USING (true) WITH CHECK (true);
-- NOTE: No DELETE policy to block client-side deletions

-- Note: 'orange_points_ledger' already has RLS enabled and only has SELECT policies defined from previous migrations.
