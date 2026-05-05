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

async function seedItinerary() {
    console.log('🌱 Seeding itinerary for Rio de Janeiro trip...');

    try {
        // 1. Find the Rio trip
        const { data: trips, error: tripError } = await supabase
            .from('trips')
            .select('id, start_date')
            .ilike('name', '%Río%')
            .is('archived_at', null)
            .limit(1);

        if (tripError) throw tripError;
        if (!trips || trips.length === 0) {
            console.error('❌ Rio trip not found!');
            return;
        }

        const trip = trips[0];
        console.log(`✅ Found trip: ${trip.id}`);

        // 2. Create Day 1
        const { data: day, error: dayError } = await supabase
            .from('trip_itinerary_days')
            .insert({
                trip_id: trip.id,
                day_number: 1,
                date: trip.start_date, // Assuming starts on start_date
                title: 'Llegada a Río',
                sort_index: 1
            })
            .select()
            .single();

        if (dayError) throw dayError;
        console.log(`✅ Created Day 1: ${day.id}`);

        // 3. Create Activities
        const activities = [
            {
                trip_id: trip.id,
                day_id: day.id,
                title: 'Check-in en Hotel',
                description: 'Llegada al hotel y registro. Tiempo libre para descansar del viaje.',
                time: '14:00:00',
                location_name: 'Hotel Copacabana Palace',
                location_detail: 'https://maps.app.goo.gl/Q7Z9Z9Z9Z9Z9Z9Z9', // Example valid-looking format
                sort_index: 1,
                instructions_text: 'Presentar pasaporte y voucher de reserva en recepción. El check-in es a partir de las 14hs.'
            },
            {
                trip_id: trip.id,
                day_id: day.id,
                title: 'Cena de Bienvenida',
                description: 'Cena grupal para conocer a los compañeros de viaje.',
                time: '20:30:00',
                location_name: 'Restaurante Marius Degustare',
                location_detail: 'https://maps.app.goo.gl/X8Y8Y8Y8Y8Y8Y8Y8', // Example valid-looking format
                sort_index: 2,
                instructions_text: 'Nos encontramos en el lobby del hotel a las 20:00hs. Vestimenta casual elegante.'
            }
        ];

        const { error: paramsError } = await supabase
            .from('trip_itinerary_items')
            .insert(activities);

        if (paramsError) throw paramsError;
        console.log('✅ Created 2 activities');

        console.log('✨ Seeding completed successfully!');

    } catch (err) {
        console.error('❌ Error seeding data:', err);
    }
}

seedItinerary();
