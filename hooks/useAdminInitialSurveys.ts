import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface InitialSurveyRecord {
    id: string;
    passenger_id: string;
    nps: number;
    rating_attention: number;
    info_clear: string;
    understood_needs: string;
    booking_ease: number;
    comment: string | null;
    responded_at: string;
    // Joined
    passenger_name: string;
}

export interface InitialSurveyStats {
    total: number;
    avg_nps: number;
    avg_rating_attention: number;
    avg_booking_ease: number;
    pct_promoters: number;      // NPS 9-10
    pct_neutral: number;        // NPS 7-8
    pct_detractors: number;     // NPS 0-6
    // info_clear breakdown
    pct_info_clear_yes: number;
    pct_info_clear_parcial: number;
    pct_info_clear_no: number;
    // understood_needs breakdown
    pct_understood_yes: number;
    pct_understood_more_or_less: number;
    pct_understood_no: number;
}

export const useAdminInitialSurveys = () => {
    const [surveys, setSurveys] = useState<InitialSurveyRecord[]>([]);
    const [filteredSurveys, setFilteredSurveys] = useState<InitialSurveyRecord[]>([]);
    const [stats, setStats] = useState<InitialSurveyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filterSearch, setFilterSearch] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    useEffect(() => { fetchSurveys(); }, []);
    useEffect(() => { applyFilters(); }, [surveys, filterSearch, filterDateFrom, filterDateTo]);

    const fetchSurveys = async () => {
        try {
            setLoading(true);
            setError(null);

            // Determine current user role for scoped visibility
            const { data: { user } } = await supabase.auth.getUser();
            let currentRole: string | null = null;
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                currentRole = profile?.role ?? null;
            }

            const { data, error: err } = await supabase
                .from('initial_surveys')
                .select(`
                    id,
                    passenger_id,
                    nps,
                    rating_attention,
                    info_clear,
                    understood_needs,
                    booking_ease,
                    comment,
                    responded_at,
                    passengers (
                        first_name,
                        last_name,
                        assigned_to
                    )
                `)
                .order('responded_at', { ascending: false });

            if (err) throw err;

            // Filter client-side for operators: only show surveys from their assigned passengers
            let rows = data || [];
            if (currentRole === 'operator' && user) {
                rows = rows.filter((row: any) => row.passengers?.assigned_to === user.id);
            }

            const mapped: InitialSurveyRecord[] = rows.map((row: any) => ({
                id: row.id,
                passenger_id: row.passenger_id,
                nps: row.nps,
                rating_attention: row.rating_attention,
                info_clear: row.info_clear,
                understood_needs: row.understood_needs,
                booking_ease: row.booking_ease,
                comment: row.comment,
                responded_at: row.responded_at,
                passenger_name: `${row.passengers?.first_name || ''} ${row.passengers?.last_name || ''}`.trim(),
            }));

            setSurveys(mapped);
        } catch (err: any) {
            console.error('Error fetching initial surveys:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...surveys];

        if (filterSearch) {
            const q = filterSearch.toLowerCase();
            result = result.filter(s => s.passenger_name.toLowerCase().includes(q));
        }
        if (filterDateFrom) {
            result = result.filter(s => s.responded_at >= filterDateFrom);
        }
        if (filterDateTo) {
            const to = filterDateTo + 'T23:59:59';
            result = result.filter(s => s.responded_at <= to);
        }

        setFilteredSurveys(result);
        computeStats(result);
    };

    const computeStats = (data: InitialSurveyRecord[]) => {
        const n = data.length;
        if (n === 0) {
            setStats({ total: 0, avg_nps: 0, avg_rating_attention: 0, avg_booking_ease: 0, pct_promoters: 0, pct_neutral: 0, pct_detractors: 0, pct_info_clear_yes: 0, pct_info_clear_parcial: 0, pct_info_clear_no: 0, pct_understood_yes: 0, pct_understood_more_or_less: 0, pct_understood_no: 0 });
            return;
        }
        const pct = (count: number) => Math.round((count / n) * 100);
        const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        setStats({
            total: n,
            avg_nps: Math.round(avg(data.map(s => s.nps)) * 10) / 10,
            avg_rating_attention: Math.round(avg(data.map(s => s.rating_attention)) * 10) / 10,
            avg_booking_ease: Math.round(avg(data.map(s => s.booking_ease)) * 10) / 10,
            pct_promoters: pct(data.filter(s => s.nps >= 9).length),
            pct_neutral: pct(data.filter(s => s.nps >= 7 && s.nps <= 8).length),
            pct_detractors: pct(data.filter(s => s.nps <= 6).length),
            pct_info_clear_yes: pct(data.filter(s => s.info_clear === 'Sí').length),
            pct_info_clear_parcial: pct(data.filter(s => s.info_clear === 'Parcialmente').length),
            pct_info_clear_no: pct(data.filter(s => s.info_clear === 'No').length),
            pct_understood_yes: pct(data.filter(s => s.understood_needs === 'Sí totalmente').length),
            pct_understood_more_or_less: pct(data.filter(s => s.understood_needs === 'Más o menos').length),
            pct_understood_no: pct(data.filter(s => s.understood_needs === 'No').length),
        });
    };

    return {
        surveys: filteredSurveys,
        stats,
        loading,
        error,
        refetch: fetchSurveys,
        filterSearch, setFilterSearch,
        filterDateFrom, setFilterDateFrom,
        filterDateTo, setFilterDateTo,
    };
};
