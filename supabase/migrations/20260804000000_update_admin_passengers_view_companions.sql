-- Migration: Update Admin Passengers View for Companions & Fix Document Check Constraint
-- Description:
-- 1. Fixes the 'valid_document' check constraint on public.passengers so documents are optional (allows NULL/NULL or valid pair)
-- 2. Adds parent_passenger_id, parent_first_name, parent_last_name, savia_file_number, and avatar_url to v_admin_passengers_list

-- 1. Actualizar la restricción de documento en la tabla passengers
ALTER TABLE public.passengers DROP CONSTRAINT IF EXISTS valid_document;
ALTER TABLE public.passengers ADD CONSTRAINT valid_document CHECK (
    (document_type IS NULL AND document_number IS NULL) OR 
    (document_type IS NOT NULL AND document_number IS NOT NULL AND trim(document_number) <> '')
);

-- 2. Asegurar que la clave foránea de parent_passenger_id tenga eliminación en cascada
ALTER TABLE public.passengers 
DROP CONSTRAINT IF EXISTS passengers_parent_passenger_id_fkey,
ADD CONSTRAINT passengers_parent_passenger_id_fkey 
FOREIGN KEY (parent_passenger_id) REFERENCES public.passengers(id) ON DELETE CASCADE;

-- 3. Actualizar la vista v_admin_passengers_list
DROP VIEW IF EXISTS public.v_admin_passengers_list;
CREATE VIEW public.v_admin_passengers_list AS
SELECT 
    p.id,
    p.profile_id AS user_id,
    p.first_name,
    p.last_name,
    p.email AS passenger_email,
    p.phone,
    p.document_type,
    p.document_number,
    p.savia_file_number,
    pt.code AS type_code,
    pt.name AS type_name,
    p.is_recurrent,
    p.created_at,
    p.archived_at,
    p.assigned_to,
    p.parent_passenger_id,
    parent.first_name AS parent_first_name,
    parent.last_name AS parent_last_name,
    prof.avatar_url,
    op.full_name AS operator_name
FROM public.passengers p
    LEFT JOIN public.passenger_types pt ON p.passenger_type_id = pt.id
    LEFT JOIN public.profiles prof ON p.profile_id = prof.id
    LEFT JOIN public.profiles op ON p.assigned_to = op.id
    LEFT JOIN public.passengers parent ON p.parent_passenger_id = parent.id;
