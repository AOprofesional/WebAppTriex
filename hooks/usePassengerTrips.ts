
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';

type Trip = Tables<'trips'>;

export const usePassengerTrips = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
    const [nextTrip, setNextTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPassengerTrips();
    }, []);

    const fetchPassengerTrips = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Get passenger record for current user
            const { data: passenger, error: passengerError } = await supabase
                .from('passengers')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (passengerError) throw passengerError;
            if (!passenger) throw new Error('No passenger record found');

            // Get trips for this passenger
            const { data: tripPassengers, error: tpError } = await supabase
                .from('trip_passengers')
                .select('trip_id')
                .eq('passenger_id', passenger.id);

            if (tpError) throw tpError;

            if (!tripPassengers || tripPassengers.length === 0) {
                setTrips([]);
                setActiveTrip(null);
                setNextTrip(null);
                return;
            }

            const tripIds = tripPassengers.map(tp => tp.trip_id);

            // Fetch full trip details
            const { data: tripsData, error: tripsError } = await supabase
                .from('trips')
                .select('*')
                .in('id', tripIds)
                .is('archived_at', null)
                .order('start_date', { ascending: true });

            if (tripsError) throw tripsError;

            setTrips(tripsData || []);

            // Determine active and next trips
            const today = new Date().toISOString().split('T')[0];
            const active = tripsData?.find(
                t => t.start_date <= today && t.end_date >= today
            ) || null;

            const upcoming = tripsData?.find(
                t => t.start_date > today
            ) || null;

            setActiveTrip(active);
            setNextTrip(upcoming);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching passenger trips:', err);
        } finally {
            setLoading(false);
        }
    };

    const refetch = () => {
        fetchPassengerTrips();
    };

    return {
        trips,
        activeTrip,
        nextTrip,
        loading,
        error,
        refetch,
    };
};
