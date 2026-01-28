
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';

type Trip = Tables<'trips'>;
type Voucher = Tables<'vouchers'>;
type DocRequirement = Tables<'trip_documents_requirements'>;

type TripDetails = {
    trip: Trip | null;
    vouchers: Voucher[];
    documentRequirements: DocRequirement[];
};

export const useTripDetails = (tripId?: string) => {
    const [data, setData] = useState<TripDetails>({
        trip: null,
        vouchers: [],
        documentRequirements: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (tripId) {
            fetchTripDetails(tripId);
        } else {
            fetchActiveTrip();
        }
    }, [tripId]);

    const fetchActiveTrip = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Get passenger record
            const { data: passenger } = await supabase
                .from('passengers')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!passenger) throw new Error('No passenger record found');

            // Get trip IDs for this passenger
            const { data: tripPassengers } = await supabase
                .from('trip_passengers')
                .select('trip_id')
                .eq('passenger_id', passenger.id);

            if (!tripPassengers || tripPassengers.length === 0) {
                setLoading(false);
                return;
            }

            const tripIds = tripPassengers.map(tp => tp.trip_id);

            // Fetch active or next trip
            const today = new Date().toISOString().split('T')[0];
            const { data: trips } = await supabase
                .from('trips')
                .select('*')
                .in('id', tripIds)
                .is('archived_at', null)
                .order('start_date', { ascending: true });

            if (!trips || trips.length === 0) {
                setLoading(false);
                return;
            }

            // Find active trip or next future trip
            const activeTrip = trips.find(
                t => t.start_date <= today && t.end_date >= today
            ) || trips.find(t => t.start_date > today) || trips[0];

            await fetchTripDetails(activeTrip.id);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching active trip:', err);
            setLoading(false);
        }
    };

    const fetchTripDetails = async (id: string) => {
        try {
            setLoading(true);
            setError(null);

            // Fetch trip
            const { data: trip, error: tripError } = await supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single();

            if (tripError) throw tripError;

            // Fetch vouchers
            const { data: vouchers, error: vouchersError } = await supabase
                .from('vouchers')
                .select('*')
                .eq('trip_id', id)
                .is('archived_at', null)
                .order('created_at', { ascending: false });

            if (vouchersError) throw vouchersError;

            // Fetch document requirements
            const { data: documentRequirements, error: docsError } = await supabase
                .from('trip_documents_requirements')
                .select('*')
                .eq('trip_id', id)
                .is('archived_at', null)
                .order('is_required', { ascending: false });

            if (docsError) throw docsError;

            setData({
                trip: trip || null,
                vouchers: vouchers || [],
                documentRequirements: documentRequirements || [],
            });
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching trip details:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        ...data,
        loading,
        error,
        refetch: () => {
            if (data.trip) {
                fetchTripDetails(data.trip.id);
            } else {
                fetchActiveTrip();
            }
        },
    };
};
