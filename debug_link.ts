
import { supabase } from './lib/supabase';

// Las credenciales se leen desde .env.local vía lib/supabase.ts


async function checkLink() {
    const email = 'maxiplayer33@gmail.com';
    const tripNamePartial = 'Bariloche';

    console.log(`Checking for passenger: ${email}`);
    const { data: passengers, error: pError } = await supabase
        .from('passengers')
        .select('*')
        .ilike('email', email);

    if (pError) console.error('Passenger error:', pError);
    console.log('Passengers found:', passengers);

    if (!passengers || passengers.length === 0) {
        console.log('No passenger found!');
        return;
    }
    const passenger = passengers[0];

    console.log(`Checking for trip like: ${tripNamePartial}`);
    const { data: trips, error: tError } = await supabase
        .from('trips')
        .select('*')
        .ilike('name', `%${tripNamePartial}%`);

    if (tError) console.error('Trip error:', tError);
    console.log('Trips found:', trips?.map(t => ({ id: t.id, name: t.name })));

    if (!trips || trips.length === 0) {
        console.log('No trip found!');
        return;
    }
    const trip = trips[0]; // Assuming first one is correct for now

    console.log(`Checking link in trip_passengers for P: ${passenger.id} and T: ${trip.id}`);
    const { data: link, error: lError } = await supabase
        .from('trip_passengers')
        .select('*')
        .eq('passenger_id', passenger.id)
        .eq('trip_id', trip.id);

    if (lError) console.error('Link error:', lError);
    console.log('Link found:', link);
}

checkLink();
