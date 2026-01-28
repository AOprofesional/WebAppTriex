
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

export const useItineraryItems = (dayId: string | null) => {
    const [items, setItems] = useState<ItineraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (dayId) {
            fetchItems();
        } else {
            setItems([]);
            setLoading(false);
        }
    }, [dayId]);

    const fetchItems = async () => {
        if (!dayId) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('trip_itinerary_items')
                .select('*')
                .eq('day_id', dayId)
                .is('archived_at', null)
                .order('sort_index', { ascending: true });

            if (fetchError) throw fetchError;

            setItems(data || []);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching itinerary items:', err);
        } finally {
            setLoading(false);
        }
    };

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
                setItems([...items, data]);
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
                setItems(items.map(i => i.id === itemId ? data : i));
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

            setItems(items.filter(i => i.id !== itemId));

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

            // Update sort_index for all affected items
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
        fetchItems,
        addItem,
        updateItem,
        deleteItem,
        moveItem,
    };
};
