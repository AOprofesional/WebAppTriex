import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        // Deshabilitamos Realtime completamente porque usamos polling en su lugar.
        // Todos los supabase.channel() con postgres_changes fueron reemplazados
        // por setInterval para evitar CHANNEL_ERROR por incompatibilidad con RLS.
        params: {
            eventsPerSecond: -1,
        },
    },
});

// Types for database
export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: 'passenger' | 'operator' | 'admin';
    created_at: string;
}
