-- Drop the old policy
DROP POLICY IF EXISTS "Admins and operators can update survey settings" ON public.survey_settings;

-- Create the new policy using the profiles table
CREATE POLICY "Admins and operators can update survey settings"
    ON public.survey_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'operator')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'operator')
        )
    );
