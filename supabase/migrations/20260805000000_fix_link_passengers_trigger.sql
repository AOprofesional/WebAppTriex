-- Migration: Fix link_passengers_to_profile Trigger and claim_passenger_by_email RPC for Companions
-- Description: 
-- 1. Corrects public.link_passengers_to_profile() so it only links the primary passenger.
-- 2. Corrects public.claim_passenger_by_email() RPC so that when logging in from email link / OTP,
--    it links only the primary passenger (parent_passenger_id IS NULL) and doesn't violate
--    the unique constraint passengers_profile_id_key when companions share the same email.

-- 1. Trigger de vinculación al crear perfil
CREATE OR REPLACE FUNCTION public.link_passengers_to_profile()
RETURNS trigger AS $$
BEGIN
  -- Vincular únicamente al pasajero principal (donde parent_passenger_id IS NULL)
  -- Los acompañantes quedan vinculados a través de parent_passenger_id
  UPDATE public.passengers
  SET profile_id = NEW.id
  WHERE email = NEW.email 
    AND parent_passenger_id IS NULL 
    AND profile_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger en la tabla profiles
DROP TRIGGER IF EXISTS on_profile_created_link_passengers ON public.profiles;
CREATE TRIGGER on_profile_created_link_passengers
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.link_passengers_to_profile();


-- 2. Función RPC para vincular pasajero al iniciar sesión (AuthCallback / Magic Link)
CREATE OR REPLACE FUNCTION public.claim_passenger_by_email()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_email text;
    v_passenger record;
    v_already_linked record;
BEGIN
    -- Obtener ID del usuario autenticado
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'status', 'ERROR',
            'passenger_id', NULL,
            'message', 'Usuario no autenticado'
        );
    END IF;

    -- Obtener el email del usuario (desde auth.users o jwt)
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = v_user_id;

    IF v_email IS NULL THEN
        v_email := auth.jwt() ->> 'email';
    END IF;

    IF v_email IS NULL THEN
        RETURN json_build_object(
            'status', 'ERROR',
            'passenger_id', NULL,
            'message', 'No se pudo obtener el email del usuario'
        );
    END IF;

    -- 1. Verificar si ya tiene un pasajero vinculado a su perfil
    SELECT * INTO v_already_linked
    FROM public.passengers
    WHERE profile_id = v_user_id
    LIMIT 1;

    IF v_already_linked.id IS NOT NULL THEN
        IF v_already_linked.archived_at IS NOT NULL THEN
            RETURN json_build_object(
                'status', 'ARCHIVED',
                'passenger_id', v_already_linked.id,
                'message', 'Esta cuenta ha sido archivada'
            );
        END IF;

        RETURN json_build_object(
            'status', 'ALREADY_LINKED',
            'passenger_id', v_already_linked.id,
            'message', 'Pasajero ya vinculado'
        );
    END IF;

    -- 2. Buscar el pasajero TITULAR por email (parent_passenger_id IS NULL)
    SELECT * INTO v_passenger
    FROM public.passengers
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_email))
      AND parent_passenger_id IS NULL
    ORDER BY created_at ASC
    LIMIT 1;

    -- Fallback: si no hay titular explícito, buscar el primer registro con ese email
    IF v_passenger.id IS NULL THEN
        SELECT * INTO v_passenger
        FROM public.passengers
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_email))
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    -- 3. Si no existe ningún pasajero con ese email
    IF v_passenger.id IS NULL THEN
        RETURN json_build_object(
            'status', 'NOT_FOUND',
            'passenger_id', NULL,
            'message', 'No se encontró pasajero con este email'
        );
    END IF;

    -- 4. Si el pasajero está archivado
    IF v_passenger.archived_at IS NOT NULL THEN
        RETURN json_build_object(
            'status', 'ARCHIVED',
            'passenger_id', v_passenger.id,
            'message', 'El pasajero está archivado'
        );
    END IF;

    -- 5. Si el pasajero ya tiene otro profile_id distinto asignado
    IF v_passenger.profile_id IS NOT NULL AND v_passenger.profile_id <> v_user_id THEN
        RETURN json_build_object(
            'status', 'CONFLICT',
            'passenger_id', v_passenger.id,
            'message', 'El pasajero ya está vinculado a otra cuenta'
        );
    END IF;

    -- 6. Vincular ÚNICAMENTE al pasajero específico (usando su ID directo)
    UPDATE public.passengers
    SET profile_id = v_user_id
    WHERE id = v_passenger.id;

    RETURN json_build_object(
        'status', 'OK_LINKED',
        'passenger_id', v_passenger.id,
        'message', 'Pasajero vinculado exitosamente'
    );
END;
$$;
