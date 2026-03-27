-- Fix visibility of surveys for superadmin role
-- The previous policies only granted access to 'operator' and 'admin', omitting 'superadmin'.

-- 1. Grant superadmin access to initial_surveys
CREATE POLICY "Superadmins can view all initial surveys" ON public.initial_surveys
FOR SELECT USING (
    get_my_role_direct() = 'superadmin'
);

-- 2. Grant superadmin access to trip_surveys
CREATE POLICY "Superadmins can view all trip surveys" ON public.trip_surveys
FOR SELECT USING (
    get_my_role_direct() = 'superadmin'
);
