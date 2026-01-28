
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ItineraryDay {
    id: string;
    trip_id: string;
    day_number: number;
    date: string | null;
    title: string | null;
    sort_index: number;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
}

export const useItineraryDays = (tripId: string | null) => {
    const [days, setDays] = useState<ItineraryDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (tripId) {
            fetchDays();
        } else {
            setLoading(false);
        }
    }, [tripId]);

    const fetchDays = async () => {
        if (!tripId) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('trip_itinerary_days')
                .select('*')
                .eq('trip_id', tripId)
                .is('archived_at', null)
                .order('sort_index', { ascending: true });

            if (fetchError) throw fetchError;

            setDays(data || []);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching itinerary days:', err);
        } finally {
            setLoading(false);
        }
    };

    const addDay = async () => {
        if (!tripId) return { data: null, error: 'No trip ID provided' };

        try {
            const maxDayNumber = days.length > 0
                ? Math.max(...days.map(d => d.day_number))
                : 0;

            const { data, error: insertError } = await supabase
                .from('trip_itinerary_days')
                .insert({
                    trip_id: tripId,
                    day_number: maxDayNumber + 1,
                    sort_index: maxDayNumber + 1,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            if (data) {
                setDays([...days, data]);
            }

            return { data, error: null };
        } catch (err: any) {
            console.error('Error adding day:', err);
            return { data: null, error: err.message };
        }
    };

    const updateDay = async (dayId: string, updates: Partial<ItineraryDay>) => {
        try {
            const { data, error: updateError } = await supabase
                .from('trip_itinerary_days')
                .update(updates)
                .eq('id', dayId)
                .select()
                .single();

            if (updateError) throw updateError;

            if (data) {
                setDays(days.map(d => d.id === dayId ? data : d));
            }

            return { data, error: null };
        } catch (err: any) {
            console.error('Error updating day:', err);
            return { data: null, error: err.message };
        }
    };

    const deleteDay = async (dayId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('trip_itinerary_days')
                .update({ archived_at: new Date().toISOString() })
                .eq('id', dayId);

            if (deleteError) throw deleteError;

            setDays(days.filter(d => d.id !== dayId));

            return { error: null };
        } catch (err: any) {
            console.error('Error deleting day:', err);
            return { error: err.message };
        }
    };

    const reorderDays = async (fromIndex: number, toIndex: number) => {
        try {
            const newDays = [...days];
            const [moved] = newDays.splice(fromIndex, 1);
            newDays.splice(toIndex, 0, moved);

            // Update sort_index for all affected days
            const updates = newDays.map((day, index) => ({
                id: day.id,
                sort_index: index,
            }));

            await Promise.all(
                updates.map(({ id, sort_index }) =>
                    supabase
                        .from('trip_itinerary_days')
                        .update({ sort_index })
                        .eq('id', id)
                )
            );

            setDays(newDays);

            return { error: null };
        } catch (err: any) {
            console.error('Error reordering days:', err);
            return { error: err.message };
        }
    };

    return {
        days,
        loading,
        error,
        fetchDays,
        addDay,
        updateDay,
        deleteDay,
        reorderDays,
    };
};
