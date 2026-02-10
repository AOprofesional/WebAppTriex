import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://gcziorsiqzwxbebxafeo.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjemlvcnNpcXp3eGJlYnhhZmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODE1MzEsImV4cCI6MjA4NDY1NzUzMX0.xMm4qHhCn22J0xEjejC8RTmQYBNDLFD0ZPJ4rey_A6M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: 'passenger' | 'operator' | 'admin';
    created_at: string;
}
