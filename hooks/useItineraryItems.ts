import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { queryCache } from '../lib/queryCache';

export interface ItineraryItem {
    id: string;
    trip_id: string;
    day_id: string;
    time: string | null;
    title: string;
    description: string | null;
    location_name: string | null;
    location_detail: string | null;
    instructions_url: string | null;
    instructions_text: string | null;
    sort_index: number;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
}

export const useItineraryItems = (dayId: string | null | undefined) => {
    const cacheKey = `itinerary_items:${dayId || 'none'}`;
    const initialCache = dayId ? queryCache.get<ItineraryItem[]>(cacheKey) : null;

    const [items, setItems] = useState<ItineraryItem[]>(initialCache?.data || []);
    const [loading, setLoading] = useState(!initialCache && !!dayId);
    const [error, setError] = useState<string | null>(null);
    const isFirstMount = useRef(true);

    const fetchItems = async (force: boolean = false) => {
        if (!dayId) {
            setItems([]);
            setLoading(false);
            return;
        }

        try {
            const currentCache = queryCache.get<ItineraryItem[]>(cacheKey);
            if (!currentCache?.data) {
                setLoading(true);
            }
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('trip_itinerary_items')
                .select('*')
                .eq('day_id', dayId)
                .is('archived_at', null)
                .order('sort_index', { ascending: true });

            if (fetchError) throw fetchError;

            const fetchedItems = data || [];
            setItems(fetchedItems);
            queryCache.set(cacheKey, fetchedItems);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching itinerary items:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!dayId) {
            setItems([]);
            setLoading(false);
            return;
        }

        const cached = queryCache.get<ItineraryItem[]>(cacheKey);
        if (cached?.data) {
            setItems(cached.data);
            setLoading(false);

            if (cached.isFresh && isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }
        }

        isFirstMount.current = false;
        fetchItems();
    }, [dayId]);

    const addItem = async (tripId: string, itemData: Partial<ItineraryItem>) => {
        if (!dayId) return { data: null, error: 'No day ID provided' };

        try {
            const maxSortIndex = items.length > 0
                ? Math.max(...items.map(i => i.sort_index))
                : 0;

            const { data, error: insertError } = await supabase
                .from('trip_itinerary_items')
                .insert({
                    ...itemData,
                    trip_id: tripId,
                    day_id: dayId,
                    sort_index: maxSortIndex + 1,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            if (data) {
                const updated = [...items, data];
                setItems(updated);
                queryCache.set(cacheKey, updated);
            }

            return { data, error: null };
        } catch (err: any) {
            console.error('Error adding item:', err);
            return { data: null, error: err.message };
        }
    };

    const updateItem = async (itemId: string, updates: Partial<ItineraryItem>) => {
        try {
            const { data, error: updateError } = await supabase
                .from('trip_itinerary_items')
                .update(updates)
                .eq('id', itemId)
                .select()
                .single();

            if (updateError) throw updateError;

            if (data) {
                const updated = items.map(i => i.id === itemId ? data : i);
                setItems(updated);
                queryCache.set(cacheKey, updated);
            }

            return { data, error: null };
        } catch (err: any) {
            console.error('Error updating item:', err);
            return { data: null, error: err.message };
        }
    };

    const deleteItem = async (itemId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('trip_itinerary_items')
                .update({ archived_at: new Date().toISOString() })
                .eq('id', itemId);

            if (deleteError) throw deleteError;

            const updated = items.filter(i => i.id !== itemId);
            setItems(updated);
            queryCache.set(cacheKey, updated);

            return { error: null };
        } catch (err: any) {
            console.error('Error deleting item:', err);
            return { error: err.message };
        }
    };

    const moveItem = async (fromIndex: number, toIndex: number) => {
        try {
            const newItems = [...items];
            const [moved] = newItems.splice(fromIndex, 1);
            newItems.splice(toIndex, 0, moved);

            const updates = newItems.map((item, index) => ({
                id: item.id,
                sort_index: index,
            }));

            await Promise.all(
                updates.map(({ id, sort_index }) =>
                    supabase
                        .from('trip_itinerary_items')
                        .update({ sort_index })
                        .eq('id', id)
                )
            );

            setItems(newItems);
            queryCache.set(cacheKey, newItems);

            return { error: null };
        } catch (err: any) {
            console.error('Error reordering item:', err);
            return { error: err.message };
        }
    };

    return {
        items,
        loading,
        error,
        fetchItems: () => fetchItems(true),
        addItem,
        updateItem,
        deleteItem,
        moveItem,
    };
};
