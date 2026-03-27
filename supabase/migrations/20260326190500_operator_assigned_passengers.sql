-- 1. Add assigned_to column
ALTER TABLE public.passengers ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);

-- 2. Migrate existing created_by to assigned_to to preserve access
UPDATE public.passengers SET assigned_to = created_by WHERE assigned_to IS NULL AND created_by IS NOT NULL;

-- 3. Drop and Recreate view to include assigned_to
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
    p.assigned_to
   FROM public.passengers p
     LEFT JOIN public.passenger_types pt ON p.passenger_type_id = pt.id
     LEFT JOIN public.profiles prof ON p.profile_id = prof.id
  WHERE prof.role = 'passenger'::text OR prof.role IS NULL;

-- 4. Update RLS policies
DROP POLICY IF EXISTS "Staff can view all passengers" ON public.passengers;
CREATE POLICY "Staff can view all passengers" ON public.passengers
FOR SELECT USING (
    get_my_role_direct() IN ('admin', 'superadmin') 
    OR 
    (get_my_role_direct() = 'operator' AND assigned_to = auth.uid())
);

DROP POLICY IF EXISTS "Staff can update all passengers" ON public.passengers;
CREATE POLICY "Staff can update all passengers" ON public.passengers
FOR UPDATE USING (
    get_my_role_direct() IN ('admin', 'superadmin') 
    OR 
    (get_my_role_direct() = 'operator' AND assigned_to = auth.uid())
) WITH CHECK (
    get_my_role_direct() IN ('admin', 'superadmin') 
    OR 
    (get_my_role_direct() = 'operator' AND assigned_to = auth.uid())
);
