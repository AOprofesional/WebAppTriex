-- Migration: Fix Admin Passengers View
-- Description: Removes the filter that hides passengers linked to profiles with roles other than 'passenger'
-- This was causing the issue where admins couldn't see passengers they created specifically for themselves (with their own email) to test the platform.

DROP VIEW IF EXISTS public.v_admin_passengers_list;
CREATE VIEW public.v_admin_passengers_list AS
SELECT p.id,
    p.profile_id AS user_id,
    p.first_name,
    p.last_name,
    p.email AS passenger_email,
    p.phone,
    p.document_type,
    p.document_number,
    pt.code AS type_code,
    pt.name AS type_name,
    p.is_recurrent,
    p.created_at,
    p.archived_at,
    p.assigned_to,
    op.full_name AS operator_name
   FROM public.passengers p
     LEFT JOIN public.passenger_types pt ON p.passenger_type_id = pt.id
     LEFT JOIN public.profiles prof ON p.profile_id = prof.id
     LEFT JOIN public.profiles op ON p.assigned_to = op.id;
-- Removed: WHERE prof.role = 'passenger'::text OR prof.role IS NULL;
