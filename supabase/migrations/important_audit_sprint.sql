-- ==============================================================================
-- Migration: Add Audit Log and Trip Details Enum Constraints
-- Description: Creates the audit_log table for tracking sensitive admin actions
--              and adds CHECK constraints to trips (trip_type, brand_sub).
-- ==============================================================================

-- 1. Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- Set up RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Authenticated users (admins or system functions) can insert logs
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_log
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

COMMENT ON TABLE public.audit_log IS 'Lightweight table to trace sensitive actions like hard deletes or manual point adjustments.';

-- ==============================================================================
-- 2. Enforce Enum Constraints on Trips Table
-- ==============================================================================

-- First, ensure there are no orphaned/invalid values in the database before applying the constraint
UPDATE public.trips 
SET brand_sub = 'Triex Egresados' 
WHERE brand_sub IS NULL OR brand_sub NOT IN ('Triex Sin Barreras', 'Wine Adventure', 'Triex Group', 'Triex Egresados', 'Triex Europa', 'Triex Caribe', 'Triex Brasil');

UPDATE public.trips 
SET trip_type = 'EGRESADOS' 
WHERE trip_type IS NULL OR trip_type NOT IN ('EGRESADOS', 'CORPORATIVO', 'FAMILIAR', 'GRUPO', 'GRUPAL', 'INDIVIDUAL');

-- Add CHECK constraint for trip_type
ALTER TABLE public.trips
ADD CONSTRAINT chk_trip_type
CHECK (trip_type IS NULL OR trip_type IN ('EGRESADOS', 'CORPORATIVO', 'FAMILIAR', 'GRUPO', 'GRUPAL', 'INDIVIDUAL'));

-- Add CHECK constraint for brand_sub
ALTER TABLE public.trips
ADD CONSTRAINT chk_brand_sub
CHECK (brand_sub IS NULL OR brand_sub IN ('Triex Sin Barreras', 'Wine Adventure', 'Triex Group', 'Triex Egresados', 'Triex Europa', 'Triex Caribe', 'Triex Brasil'));

COMMENT ON CONSTRAINT chk_trip_type ON public.trips IS 'Enforces valid trip types matching the UI dropdowns';
COMMENT ON CONSTRAINT chk_brand_sub ON public.trips IS 'Enforces valid brand sub-categories matching the UI dropdowns';
