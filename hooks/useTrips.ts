
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../types/database.types';

type Trip = Tables<'trips'>;
type TripInsert = TablesInsert<'trips'>;
type TripUpdate = TablesUpdate<'trips'>;

export const useTrips = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async (filters?: {
        statusOperational?: string;
        statusCommercial?: string;
        brandSub?: string;
        searchTerm?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('trips')
                .select('*, trip_passengers(count)')
                .is('archived_at', null)
                .order('start_date', { ascending: false });

            if (filters) {
                if (filters.statusOperational) {
                    query = query.eq('status_operational', filters.statusOperational);
                }
                if (filters.statusCommercial) {
                    query = query.eq('status_commercial', filters.statusCommercial);
                }
                if (filters.brandSub) {
                    query = query.eq('brand_sub', filters.brandSub);
                }
                if (filters.searchTerm) {
                    query = query.or(`name.ilike.%${filters.searchTerm}%,destination.ilike.%${filters.searchTerm}%,internal_code.ilike.%${filters.searchTerm}%`);
                }
                if (filters.startDate) {
                    query = query.gte('start_date', filters.startDate);
                }
                if (filters.endDate) {
                    query = query.lte('end_date', filters.endDate);
                }
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setTrips(data || []);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching trips:', err);
        } finally {
            setLoading(false);
        }
    };

    const createTrip = async (tripData: TripInsert) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error: insertError } = await supabase
                .from('trips')
                .insert({
                    ...tripData,
                    created_by: user?.id,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchTrips();
            return { data, error: null };
        } catch (err: any) {
            console.error('Error creating trip:', err);
            return { data: null, error: err.message };
        }
    };

    const updateTrip = async (id: string, tripData: TripUpdate) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error: updateError } = await supabase
                .from('trips')
                .update({
                    ...tripData,
                    updated_by: user?.id,
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchTrips();
            return { data, error: null };
        } catch (err: any) {
            console.error('Error updating trip:', err);
            return { data: null, error: err.message };
        }
    };

    const archiveTrip = async (id: string) => {
        try {
            const { error: archiveError } = await supabase
                .from('trips')
                .update({ archived_at: new Date().toISOString() })
                .eq('id', id);

            if (archiveError) throw archiveError;

            await fetchTrips();
            return { error: null };
        } catch (err: any) {
            console.error('Error archiving trip:', err);
            return { error: err.message };
        }
    };

    const getTripById = async (id: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            return { data, error: null };
        } catch (err: any) {
            console.error('Error fetching trip:', err);
            return { data: null, error: err.message };
        }
    };

    const assignPassengers = async (tripId: string, passengerIds: string[]) => {
        try {
            // Get existing assignments
            const { data: existing, error: fetchError } = await supabase
                .from('trip_passengers')
                .select('passenger_id')
                .eq('trip_id', tripId);

            if (fetchError) throw fetchError;

            const existingIds = existing?.map(e => e.passenger_id) || [];

            // IDs to add (not in existing)
            const toAdd = passengerIds.filter(id => !existingIds.includes(id));

            // IDs to remove (in existing but not in new selection)
            const toRemove = existingIds.filter(id => !passengerIds.includes(id));

            // Delete removed assignments
            if (toRemove.length > 0) {
                const { error: deleteError } = await supabase
                    .from('trip_passengers')
                    .delete()
                    .eq('trip_id', tripId)
                    .in('passenger_id', toRemove);

                if (deleteError) throw deleteError;
            }

            // Insert new assignments
            if (toAdd.length > 0) {
                const { error: insertError } = await supabase
                    .from('trip_passengers')
                    .insert(toAdd.map(pid => ({ trip_id: tripId, passenger_id: pid })));

                if (insertError) throw insertError;
            }

            return { error: null };
        } catch (err: any) {
            console.error('Error assigning passengers:', err);
            return { error: err.message };
        }
    };

    return {
        trips,
        loading,
        error,
        fetchTrips,
        createTrip,
        updateTrip,
        archiveTrip,
        getTripById,
        assignPassengers,
    };
};
