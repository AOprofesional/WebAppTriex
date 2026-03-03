import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SurveyRecord {
    id: string;
    trip_id: string;
    passenger_id: string;
    nps: number;
    rating_organization: number;
    rating_attention: number;
    comment: string | null;
    responded_at: string;
    // Joined fields
    passenger_name: string;
    trip_destination: string;
    trip_internal_code: string | null;
}

export interface SurveyStats {
    total: number;
    avg_nps: number;
    pct_promoters: number;   // NPS 8-10
    pct_neutral: number;     // NPS 7
    pct_detractors: number;  // NPS 1-6
    avg_organization: number;
    avg_attention: number;
}

export type NpsCategory = 'promoter' | 'neutral' | 'detractor';

export const getNpsCategory = (nps: number): NpsCategory => {
    if (nps >= 8) return 'promoter';
    if (nps >= 7) return 'neutral';
    return 'detractor';
};

export const useAdminSurveys = () => {
    const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
    const [filteredSurveys, setFilteredSurveys] = useState<SurveyRecord[]>([]);
    const [stats, setStats] = useState<SurveyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterTripId, setFilterTripId] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [filterOnlyDetractors, setFilterOnlyDetractors] = useState(false);
    const [sortField, setSortField] = useState<'responded_at' | 'nps'>('responded_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchSurveys();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [surveys, filterDateFrom, filterDateTo, filterTripId, filterSearch, filterOnlyDetractors, sortField, sortDir]);

    const fetchSurveys = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: err } = await supabase
                .from('trip_surveys')
                .select(`
                    id,
                    trip_id,
                    passenger_id,
                    nps,
                    rating_organization,
                    rating_attention,
                    comment,
                    responded_at,
                    passengers (
                        first_name,
                        last_name
                    ),
                    trips (
                        destination,
                        internal_code
                    )
                `)
                .order('responded_at', { ascending: false });

            if (err) throw err;

            const mapped: SurveyRecord[] = (data || []).map((row: any) => ({
                id: row.id,
                trip_id: row.trip_id,
                passenger_id: row.passenger_id,
                nps: row.nps,
                rating_organization: row.rating_organization,
                rating_attention: row.rating_attention,
                comment: row.comment,
                responded_at: row.responded_at,
                passenger_name: `${row.passengers?.first_name || ''} ${row.passengers?.last_name || ''}`.trim(),
                trip_destination: row.trips?.destination || 'Sin destino',
                trip_internal_code: row.trips?.internal_code || null,
            }));

            setSurveys(mapped);
        } catch (err: any) {
            console.error('Error fetching surveys:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...surveys];

        if (filterOnlyDetractors) {
            result = result.filter(s => s.nps <= 6);
        }
        if (filterTripId) {
            result = result.filter(s => s.trip_id === filterTripId);
        }
        if (filterSearch) {
            const q = filterSearch.toLowerCase();
            result = result.filter(
                s =>
                    s.passenger_name.toLowerCase().includes(q) ||
                    s.trip_destination.toLowerCase().includes(q) ||
                    (s.trip_internal_code?.toLowerCase().includes(q) ?? false)
            );
        }
        if (filterDateFrom) {
            result = result.filter(s => s.responded_at >= filterDateFrom);
        }
        if (filterDateTo) {
            const to = filterDateTo + 'T23:59:59';
            result = result.filter(s => s.responded_at <= to);
        }

        // Sort
        result.sort((a, b) => {
            const aVal = sortField === 'nps' ? a.nps : a.responded_at;
            const bVal = sortField === 'nps' ? b.nps : b.responded_at;
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredSurveys(result);

        // Compute stats from the filtered set
        if (result.length === 0) {
            setStats({ total: 0, avg_nps: 0, pct_promoters: 0, pct_neutral: 0, pct_detractors: 0, avg_organization: 0, avg_attention: 0 });
            return;
        }

        // Stats are always computed from the FULL dataset (non-filtered), unless only-detractors is on
        const sourceForStats = filterOnlyDetractors ? result : surveys;
        const n = sourceForStats.length;
        const promoters = sourceForStats.filter(s => s.nps >= 8).length;
        const neutrals = sourceForStats.filter(s => s.nps === 7).length;
        const detractors = sourceForStats.filter(s => s.nps <= 6).length;
        const avgNps = sourceForStats.reduce((acc, s) => acc + s.nps, 0) / n;
        const avgOrg = sourceForStats.reduce((acc, s) => acc + s.rating_organization, 0) / n;
        const avgAtt = sourceForStats.reduce((acc, s) => acc + s.rating_attention, 0) / n;

        setStats({
            total: n,
            avg_nps: Math.round(avgNps * 10) / 10,
            pct_promoters: Math.round((promoters / n) * 100),
            pct_neutral: Math.round((neutrals / n) * 100),
            pct_detractors: Math.round((detractors / n) * 100),
            avg_organization: Math.round(avgOrg * 10) / 10,
            avg_attention: Math.round(avgAtt * 10) / 10,
        });
    };

    const toggleSortField = (field: 'responded_at' | 'nps') => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    return {
        surveys: filteredSurveys,
        allSurveys: surveys,
        stats,
        loading,
        error,
        refetch: fetchSurveys,
        // Filters
        filterDateFrom, setFilterDateFrom,
        filterDateTo, setFilterDateTo,
        filterTripId, setFilterTripId,
        filterSearch, setFilterSearch,
        filterOnlyDetractors, setFilterOnlyDetractors,
        sortField, sortDir, toggleSortField,
    };
};
