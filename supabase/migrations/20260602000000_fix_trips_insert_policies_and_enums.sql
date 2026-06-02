-- Migration to fix trips insert policies and allow REEGRESADOS values

-- 1. Fix RLS policies for trips (Ensure authenticated users can insert)
DROP POLICY IF EXISTS "Trips Insert Access" ON public.trips;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.trips;

CREATE POLICY "Trips Insert Access" 
ON public.trips 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Ensure other basic policies exist just in case
DROP POLICY IF EXISTS "Trips Read Access" ON public.trips;
CREATE POLICY "Trips Read Access" ON public.trips FOR SELECT USING (true);

DROP POLICY IF EXISTS "Trips Update Access" ON public.trips;
CREATE POLICY "Trips Update Access" ON public.trips FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2. Update CHECK constraints to include REEGRESADOS and Triex Reegresados
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS chk_trip_type;
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS chk_brand_sub;

ALTER TABLE public.trips
ADD CONSTRAINT chk_trip_type
CHECK (trip_type IS NULL OR trip_type IN ('EGRESADOS', 'REEGRESADOS', 'CORPORATIVO', 'FAMILIAR', 'GRUPO', 'GRUPAL', 'INDIVIDUAL'));

ALTER TABLE public.trips
ADD CONSTRAINT chk_brand_sub
CHECK (brand_sub IS NULL OR brand_sub IN ('Triex Sin Barreras', 'Wine Adventure', 'Triex Group', 'Triex Egresados', 'Triex Reegresados', 'Triex Europa', 'Triex Caribe', 'Triex Brasil'));

