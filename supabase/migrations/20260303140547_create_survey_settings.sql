-- Create survey_settings table
CREATE TABLE public.survey_settings (
    id integer PRIMARY KEY CHECK (id = 1), -- Only one row
    q1_text text NOT NULL DEFAULT '¿Qué tan probable es que nos recomiendes?',
    q2_text text NOT NULL DEFAULT '¿Cómo calificarías la organización general del viaje?',
    q3_text text NOT NULL DEFAULT '¿Cómo fue la atención del equipo?',
    comment_placeholder text NOT NULL DEFAULT 'Si querés, contanos qué fue lo mejor o qué podríamos mejorar…',
    google_review_url text,
    is_active boolean NOT NULL DEFAULT true,
    updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.survey_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Public can read survey settings"
    ON public.survey_settings
    FOR SELECT
    TO public
    USING (true);

-- Only admins and operators can update
CREATE POLICY "Admins and operators can update survey settings"
    ON public.survey_settings
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'operator')
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'operator')
        )
    );

-- Insert default row
INSERT INTO public.survey_settings (id, google_review_url) 
VALUES (1, 'https://g.page/r/placeholder/review')
ON CONFLICT (id) DO NOTHING;
