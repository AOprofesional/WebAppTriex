import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables desde .env.local
config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local');
    process.exit(1);
}

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
