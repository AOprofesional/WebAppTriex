import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { queryCache } from '../lib/queryCache';

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

export const useItineraryDays = (tripId: string | null | undefined) => {
    const cacheKey = `itinerary_days:${tripId || 'none'}`;
    const initialCache = tripId ? queryCache.get<ItineraryDay[]>(cacheKey) : null;

    const [days, setDays] = useState<ItineraryDay[]>(initialCache?.data || []);
    const [loading, setLoading] = useState(!initialCache && !!tripId);
    const [error, setError] = useState<string | null>(null);
    const isFirstMount = useRef(true);

    const fetchDays = async (force: boolean = false) => {
        if (!tripId) {
            setDays([]);
            setLoading(false);
            return;
        }

        try {
            const currentCache = queryCache.get<ItineraryDay[]>(cacheKey);
            if (!currentCache?.data) {
                setLoading(true);
            }
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('trip_itinerary_days')
                .select('*')
                .eq('trip_id', tripId)
                .is('archived_at', null)
                .order('sort_index', { ascending: true });

            if (fetchError) throw fetchError;

            const fetchedDays = data || [];
            setDays(fetchedDays);
            queryCache.set(cacheKey, fetchedDays);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching itinerary days:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!tripId) {
            setDays([]);
            setLoading(false);
            return;
        }

        const cached = queryCache.get<ItineraryDay[]>(cacheKey);
        if (cached?.data) {
            setDays(cached.data);
            setLoading(false);

            if (cached.isFresh && isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }
        }

        isFirstMount.current = false;
        fetchDays();
    }, [tripId]);

    const addDay = async () => {
        if (!tripId) return { data: null, error: 'No trip ID provided' };

        try {
            const { data: maxDayData } = await supabase
                .from('trip_itinerary_days')
                .select('day_number')
                .eq('trip_id', tripId)
                .order('day_number', { ascending: false })
                .limit(1);

            const absMaxDayNumber = (maxDayData && maxDayData.length > 0) ? maxDayData[0].day_number : 0;

            const { data, error: insertError } = await supabase
                .from('trip_itinerary_days')
                .insert({
                    trip_id: tripId,
                    day_number: absMaxDayNumber + 1,
                    sort_index: absMaxDayNumber + 1,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            if (data) {
                const updated = [...days, data];
                setDays(updated);
                queryCache.set(cacheKey, updated);
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
                const updated = days.map(d => d.id === dayId ? data : d);
                setDays(updated);
                queryCache.set(cacheKey, updated);
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

            const updated = days.filter(d => d.id !== dayId);
            setDays(updated);
            queryCache.set(cacheKey, updated);

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
            queryCache.set(cacheKey, newDays);

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
        fetchDays: () => fetchDays(true),
        addDay,
        updateDay,
        deleteDay,
        reorderDays,
    };
};
