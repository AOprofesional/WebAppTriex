-- ==============================================================================
-- Migration: 20260805020000_fix_companion_documents_rls.sql
-- Description:
-- Fixes RLS violation (error 42501) when uploading documents for companion passengers
-- by introducing a SECURITY DEFINER helper function `get_my_accessible_passenger_ids()`
-- and updating policies on passenger_documents, surveys, points ledger, and redemptions.
-- ==============================================================================

-- 1. Helper function SECURITY DEFINER to get all passenger IDs accessible by the current user
-- (both the primary titular passenger AND all accompanying passengers)
CREATE OR REPLACE FUNCTION public.get_my_accessible_passenger_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    -- 1. Pasajero titular vinculado por profile_id
    SELECT id FROM public.passengers 
    WHERE profile_id = auth.uid() AND archived_at IS NULL
    UNION
    -- 2. Pasajero titular vinculado por email (fallback en caso de inicio de sesión)
    SELECT id FROM public.passengers 
    WHERE email IS NOT NULL 
      AND LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
      AND parent_passenger_id IS NULL
      AND archived_at IS NULL
    UNION
    -- 3. Pasajeros acompañantes cuyo parent_passenger_id pertenece al titular
    SELECT id FROM public.passengers 
    WHERE parent_passenger_id IN (
        SELECT id FROM public.passengers 
        WHERE (profile_id = auth.uid() OR (email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))))
          AND archived_at IS NULL
    ) AND archived_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_accessible_passenger_ids() TO authenticated;


-- 2. PASSENGER_DOCUMENTS RLS POLICIES
ALTER TABLE public.passenger_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Passenger Documents Read Access" ON public.passenger_documents;
DROP POLICY IF EXISTS "Passenger Documents Insert Access" ON public.passenger_documents;
DROP POLICY IF EXISTS "Passenger Documents Update Access" ON public.passenger_documents;
DROP POLICY IF EXISTS "Passenger Documents Delete Access" ON public.passenger_documents;
DROP POLICY IF EXISTS "Users can view own passenger documents" ON public.passenger_documents;
DROP POLICY IF EXISTS "Users can upload own passenger documents" ON public.passenger_documents;
DROP POLICY IF EXISTS "Users can update own passenger documents" ON public.passenger_documents;
DROP POLICY IF EXISTS "Users can delete own passenger documents" ON public.passenger_documents;
DROP POLICY IF EXISTS "Staff can manage all passenger documents" ON public.passenger_documents;

-- 2.1 SELECT Policy
CREATE POLICY "Passenger Documents Read Access" ON public.passenger_documents
FOR SELECT USING (
    -- Admins y Superadmins
    get_my_role_direct() IN ('admin', 'superadmin')
    OR
    -- Operadores para sus pasajeros asignados
    (get_my_role_direct() = 'operator' AND passenger_id IN (
        SELECT id FROM public.passengers WHERE assigned_to = auth.uid()
    ))
    OR
    -- Usuario autenticado para sus propios documentos y los de sus acompañantes
    (passenger_id IN (SELECT public.get_my_accessible_passenger_ids()))
);

-- 2.2 INSERT Policy
CREATE POLICY "Passenger Documents Insert Access" ON public.passenger_documents
FOR INSERT WITH CHECK (
    -- Admins y Superadmins
    get_my_role_direct() IN ('admin', 'superadmin')
    OR
    -- Operadores para sus pasajeros asignados
    (get_my_role_direct() = 'operator' AND passenger_id IN (
        SELECT id FROM public.passengers WHERE assigned_to = auth.uid()
    ))
    OR
    -- Usuario autenticado para sí mismo y sus acompañantes
    (passenger_id IN (SELECT public.get_my_accessible_passenger_ids()))
);

-- 2.3 UPDATE Policy
CREATE POLICY "Passenger Documents Update Access" ON public.passenger_documents
FOR UPDATE USING (
    get_my_role_direct() IN ('admin', 'superadmin')
    OR
    (get_my_role_direct() = 'operator' AND passenger_id IN (
        SELECT id FROM public.passengers WHERE assigned_to = auth.uid()
    ))
    OR
    (passenger_id IN (SELECT public.get_my_accessible_passenger_ids()))
) WITH CHECK (
    get_my_role_direct() IN ('admin', 'superadmin')
    OR
    (get_my_role_direct() = 'operator' AND passenger_id IN (
        SELECT id FROM public.passengers WHERE assigned_to = auth.uid()
    ))
    OR
    (passenger_id IN (SELECT public.get_my_accessible_passenger_ids()))
);

-- 2.4 DELETE Policy
CREATE POLICY "Passenger Documents Delete Access" ON public.passenger_documents
FOR DELETE USING (
    get_my_role_direct() IN ('admin', 'superadmin')
    OR
    (passenger_id IN (SELECT public.get_my_accessible_passenger_ids()))
);


-- 3. INITIAL_SURVEYS RLS POLICIES
DROP POLICY IF EXISTS "Pasajeros pueden ver su propia encuesta inicial" ON public.initial_surveys;
DROP POLICY IF EXISTS "Pasajeros pueden insertar su propia encuesta inicial" ON public.initial_surveys;

CREATE POLICY "Pasajeros pueden ver su propia encuesta inicial"
ON public.initial_surveys FOR SELECT
USING (
    get_my_role_direct() IN ('admin', 'superadmin', 'operator')
    OR
    passenger_id IN (SELECT public.get_my_accessible_passenger_ids())
);

CREATE POLICY "Pasajeros pueden insertar su propia encuesta inicial"
ON public.initial_surveys FOR INSERT
WITH CHECK (
    passenger_id IN (SELECT public.get_my_accessible_passenger_ids())
);


-- 4. TRIP_SURVEYS RLS POLICIES
DROP POLICY IF EXISTS "Pasajeros pueden ver su propia encuesta post-viaje" ON public.trip_surveys;
DROP POLICY IF EXISTS "Pasajeros pueden insertar su propia encuesta post-viaje" ON public.trip_surveys;

CREATE POLICY "Pasajeros pueden ver su propia encuesta post-viaje"
ON public.trip_surveys FOR SELECT
USING (
    get_my_role_direct() IN ('admin', 'superadmin', 'operator')
    OR
    passenger_id IN (SELECT public.get_my_accessible_passenger_ids())
);

CREATE POLICY "Pasajeros pueden insertar su propia encuesta post-viaje"
ON public.trip_surveys FOR INSERT
WITH CHECK (
    passenger_id IN (SELECT public.get_my_accessible_passenger_ids())
);


-- 5. ORANGE_POINTS_LEDGER RLS POLICY
DROP POLICY IF EXISTS "Passengers can view own points" ON public.orange_points_ledger;

CREATE POLICY "Passengers can view own points"
ON public.orange_points_ledger FOR SELECT
USING (
    get_my_role_direct() IN ('admin', 'superadmin', 'operator')
    OR
    passenger_id = auth.uid()
    OR
    passenger_id IN (SELECT public.get_my_accessible_passenger_ids())
);


-- 6. REDEMPTION_REQUESTS RLS POLICIES
DROP POLICY IF EXISTS "Passengers can read own redemption requests" ON public.redemption_requests;
DROP POLICY IF EXISTS "Passengers can insert own redemption requests" ON public.redemption_requests;

CREATE POLICY "Passengers can read own redemption requests"
ON public.redemption_requests FOR SELECT
USING (
    get_my_role_direct() IN ('admin', 'superadmin', 'operator')
    OR
    passenger_id = auth.uid()
    OR
    passenger_id IN (SELECT public.get_my_accessible_passenger_ids())
);

CREATE POLICY "Passengers can insert own redemption requests"
ON public.redemption_requests FOR INSERT
WITH CHECK (
    passenger_id IN (SELECT public.get_my_accessible_passenger_ids())
);
