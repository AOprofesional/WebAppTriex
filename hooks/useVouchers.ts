
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';

type Voucher = Tables<'vouchers'>;

export const useVouchers = (tripId?: string) => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVouchers();
    }, [tripId]);

    const fetchVouchers = async () => {
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

            // Build query
            let query = supabase
                .from('vouchers')
                .select('*')
                .is('archived_at', null)
                .order('created_at', { ascending: false });

            if (tripId) {
                // Get vouchers for specific trip
                query = query.eq('trip_id', tripId);
            } else {
                // Get all vouchers for passenger's trips or direct passenger vouchers
                const { data: tripPassengers } = await supabase
                    .from('trip_passengers')
                    .select('trip_id')
                    .eq('passenger_id', passenger.id);

                if (tripPassengers && tripPassengers.length > 0) {
                    const tripIds = tripPassengers.map(tp => tp.trip_id);
                    query = query.or(`trip_id.in.(${tripIds.join(',')}),passenger_id.eq.${passenger.id}`);
                } else {
                    query = query.eq('passenger_id', passenger.id);
                }
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setVouchers(data || []);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching vouchers:', err);
        } finally {
            setLoading(false);
        }
    };

    const refetch = () => {
        fetchVouchers();
    };

    return {
        vouchers,
        loading,
        error,
        refetch,
    };
};
