import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NextActivity {
    id: string;
    title: string;
    time: string | null;
    location_name: string | null;
    day_title: string | null;
    day_date: string | null;
}

export const useNextActivity = (tripId: string | undefined) => {
    const [nextActivity, setNextActivity] = useState<NextActivity | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tripId) {
            fetchNextActivity();
        } else {
            setLoading(false);
        }
    }, [tripId]);

    const fetchNextActivity = async () => {
        if (!tripId) return;

        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // 1. Get days from today onwards
            const { data: days, error: daysError } = await supabase
                .from('trip_itinerary_days')
                .select('id, date, title')
                .eq('trip_id', tripId)
                .gte('date', today)
                .is('archived_at', null)
                .order('date', { ascending: true })
                .limit(1);

            if (daysError) throw daysError;

            if (days && days.length > 0) {
                const todayDay = days[0];

                // 2. Get next item for this day
                // Note: Simple logic for now, gets first item of the day
                const { data: items, error: itemsError } = await supabase
                    .from('trip_itinerary_items')
                    .select('*')
                    .eq('day_id', todayDay.id)
                    .is('archived_at', null)
                    .order('sort_index', { ascending: true })
                    .limit(1);

                if (itemsError) throw itemsError;

                if (items && items.length > 0) {
                    const item = items[0];
                    setNextActivity({
                        id: item.id,
                        title: item.title,
                        time: item.time,
                        location_name: item.location_name,
                        day_title: todayDay.title,
                        day_date: todayDay.date
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching next activity:', err);
        } finally {
            setLoading(false);
        }
    };

    return { nextActivity, loading };
};
