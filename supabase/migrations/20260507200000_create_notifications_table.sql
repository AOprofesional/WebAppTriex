-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID REFERENCES public.passengers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad: Un pasajero puede leer sus propias notificaciones
CREATE POLICY "Passengers can view own notifications"
    ON public.notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.passengers
            WHERE passengers.id = notifications.passenger_id
            AND passengers.profile_id = auth.uid()
        )
    );

-- Políticas de seguridad: Un administrador u operador puede insertar notificaciones
CREATE POLICY "Staff can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'operator')
        )
    );

-- HABILITAR REALTIME PARA LA TABLA NOTIFICATIONS
-- Esto es fundamental para que el WebSocket no devuelva CHANNEL_ERROR
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
