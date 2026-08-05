import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { queryCache } from '../lib/queryCache';

export interface NextActivity {
    id: string;
    title: string;
    time: string | null;
    location_name: string | null;
    day_title: string | null;
    day_date: string | null;
}

export const useNextActivity = (tripId: string | undefined) => {
    const cacheKey = `next_activity:${tripId || 'none'}`;
    const initialCache = tripId ? queryCache.get<NextActivity | null>(cacheKey) : null;

    const [nextActivity, setNextActivity] = useState<NextActivity | null>(initialCache?.data || null);
    const [loading, setLoading] = useState(!initialCache && !!tripId);
    const isFirstMount = useRef(true);

    const fetchNextActivity = async (force: boolean = false) => {
        if (!tripId) {
            setLoading(false);
            return;
        }

        try {
            const currentCache = queryCache.get<NextActivity | null>(cacheKey);
            if (!currentCache?.data) {
                setLoading(true);
            }

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

            let activity: NextActivity | null = null;

            if (days && days.length > 0) {
                const todayDay = days[0];

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
                    activity = {
                        id: item.id,
                        title: item.title,
                        time: item.time,
                        location_name: item.location_name,
                        day_title: todayDay.title,
                        day_date: todayDay.date,
                    };
                }
            }

            setNextActivity(activity);
            queryCache.set(cacheKey, activity);
        } catch (err: any) {
            console.error('Error fetching next activity:', err?.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!tripId) {
            setLoading(false);
            return;
        }

        const cached = queryCache.get<NextActivity | null>(cacheKey);
        if (cached?.data !== undefined && cached !== null) {
            setNextActivity(cached.data);
            setLoading(false);

            if (cached.isFresh && isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }
        }

        isFirstMount.current = false;
        fetchNextActivity();
    }, [tripId]);

    return { nextActivity, loading };
};
