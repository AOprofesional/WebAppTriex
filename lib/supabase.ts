import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: 'passenger' | 'operator' | 'admin';
    created_at: string;
}
