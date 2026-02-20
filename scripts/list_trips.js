import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://gcziorsiqzwxbebxafeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjemlvcnNpcXp3eGJlYnhhZmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODE1MzEsImV4cCI6MjA4NDY1NzUzMX0.xMm4qHhCn22J0xEjejC8RTmQYBNDLFD0ZPJ4rey_A6M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTrips() {
    console.log('🔍 Listing all trips...');

    try {
        const { data: trips, error } = await supabase
            .from('trips')
            .select('id, name, destination');

        if (error) throw error;

        console.log('--- TIPS FOUND ---');
        trips.forEach(t => console.log(`ID: ${t.id} | Name: "${t.name}" | Dest: "${t.destination}"`));
        console.log('------------------');

    } catch (err) {
        console.error('❌ Error listing trips:', err);
    }
}

listTrips();
