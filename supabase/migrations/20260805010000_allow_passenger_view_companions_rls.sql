-- Migration: Fix Infinite Recursion in Passengers RLS Policy & Provide Safe Companion Retrieval
-- Description:
-- Fixes error 42P17 (infinite recursion detected in policy for relation "passengers") 
-- by using a SECURITY DEFINER helper function (get_my_passenger_ids) and a robust RPC function.

-- 1. Helper function SECURITY DEFINER to get user's primary passenger IDs without RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_passenger_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.passengers WHERE profile_id = auth.uid() AND archived_at IS NULL;
$$;

-- 2. Actualizar política RLS en public.passengers SIN recursión
DROP POLICY IF EXISTS "Passengers can view own record and companions" ON public.passengers;
DROP POLICY IF EXISTS "Passengers Read Access" ON public.passengers;
DROP POLICY IF EXISTS "Users can view own passenger record" ON public.passengers;

CREATE POLICY "Passengers can view own record and companions" ON public.passengers
FOR SELECT USING (
    -- Admins y Superadmins pueden ver todos
    get_my_role_direct() IN ('admin', 'superadmin')
    OR
    -- Operadores pueden ver sus pasajeros asignados
    (get_my_role_direct() = 'operator' AND assigned_to = auth.uid())
    OR
    -- Coincidencia directa por cuenta (profile_id)
    (profile_id = auth.uid())
    OR
    -- Coincidencia por correo electrónico con el usuario autenticado
    (email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email')))
    OR
    -- Acompañantes vinculados al titular autenticado (a través de helper seguro)
    (parent_passenger_id IN (SELECT public.get_my_passenger_ids()))
);

-- 3. RPC get_my_available_passengers() para recuperar titular y acompañantes de forma segura
CREATE OR REPLACE FUNCTION public.get_my_available_passengers()
RETURNS SETOF public.passengers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id uuid;
    v_email text;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Obtener email del usuario
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
    IF v_email IS NULL THEN
        v_email := auth.jwt() ->> 'email';
    END IF;

    RETURN QUERY
    WITH my_primary AS (
        SELECT *
        FROM public.passengers
        WHERE (profile_id = v_user_id OR (v_email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM(v_email))))
          AND archived_at IS NULL
    ),
    my_companions AS (
        SELECT p.*
        FROM public.passengers p
        JOIN my_primary mp ON p.parent_passenger_id = mp.id
        WHERE p.archived_at IS NULL
    )
    SELECT * FROM my_primary
    UNION
    SELECT * FROM my_companions
    ORDER BY parent_passenger_id NULLS FIRST, created_at ASC;
END;
$$;
