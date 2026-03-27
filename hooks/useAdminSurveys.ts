import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SurveyRecord {
    id: string;
    trip_id: string;
    passenger_id: string;
    // V1 legacy
    nps: number | null;
    rating_organization: number | null;
    rating_attention: number | null;
    comment: string | null;
    // V2 new fields
    rating_general: number | null;
    destination_expectation: string | null;
    services_ratings: Record<string, number | 'N/A'> | null;
    had_incident: boolean | null;
    incident_comment: string | null;
    would_buy_again: string | null;
    responded_at: string;
    // Joined fields
    passenger_name: string;
    trip_destination: string;
    trip_internal_code: string | null;
}

export interface SurveyStats {
    total: number;
    avg_general: number;
    avg_nps: number;
    pct_promoters: number;
    pct_neutral: number;
    pct_detractors: number;
    avg_organization: number;
    avg_attention: number;
    pct_would_buy_again: number;
    avg_services: Record<string, number>;
}

export type NpsCategory = 'promoter' | 'neutral' | 'detractor';

export const getNpsCategory = (nps: number | null): NpsCategory => {
    if (!nps) return 'detractor';
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

            let query = supabase
                .from('trip_surveys')
                .select(`
                    id,
                    trip_id,
                    passenger_id,
                    nps,
                    rating_organization,
                    rating_attention,
                    comment,
                    rating_general,
                    destination_expectation,
                    services_ratings,
                    had_incident,
                    incident_comment,
                    would_buy_again,
                    responded_at,
                    passengers (
                        first_name,
                        last_name,
                        assigned_to
                    ),
                    trips (
                        destination,
                        internal_code
                    )
                `)
                .order('responded_at', { ascending: false });

            const { data, error: err } = await query;
            if (err) throw err;

            // Filter client-side for operators: only show surveys where passenger.assigned_to === uid
            let rows = data || [];
            if (currentRole === 'operator' && user) {
                rows = rows.filter((row: any) => row.passengers?.assigned_to === user.id);
            }

            const mapped: SurveyRecord[] = rows.map((row: any) => ({
                id: row.id,
                trip_id: row.trip_id,
                passenger_id: row.passenger_id,
                nps: row.nps,
                rating_organization: row.rating_organization,
                rating_attention: row.rating_attention,
                comment: row.comment,
                rating_general: row.rating_general,
                destination_expectation: row.destination_expectation,
                services_ratings: row.services_ratings,
                had_incident: row.had_incident,
                incident_comment: row.incident_comment,
                would_buy_again: row.would_buy_again,
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
            result = result.filter(s => s.nps !== null && s.nps <= 6);
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
            const aVal = sortField === 'nps' ? (a.nps ?? 0) : a.responded_at;
            const bVal = sortField === 'nps' ? (b.nps ?? 0) : b.responded_at;
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredSurveys(result);

        // Compute stats from the filtered set
        const sourceForStats = filterOnlyDetractors ? result : surveys;
        const n = sourceForStats.length;

        if (n === 0) {
            setStats({ total: 0, avg_general: 0, avg_nps: 0, pct_promoters: 0, pct_neutral: 0, pct_detractors: 0, avg_organization: 0, avg_attention: 0, pct_would_buy_again: 0, avg_services: {} });
            return;
        }

        const withNps = sourceForStats.filter(s => s.nps !== null);
        const promoters = withNps.filter(s => (s.nps ?? 0) >= 8).length;
        const neutrals = withNps.filter(s => s.nps === 7).length;
        const detractors = withNps.filter(s => (s.nps ?? 0) <= 6).length;
        const avgNps = withNps.length ? withNps.reduce((acc, s) => acc + (s.nps ?? 0), 0) / withNps.length : 0;

        const withGeneral = sourceForStats.filter(s => s.rating_general !== null);
        const avgGeneral = withGeneral.length ? withGeneral.reduce((acc, s) => acc + (s.rating_general ?? 0), 0) / withGeneral.length : 0;

        const withOrg = sourceForStats.filter(s => s.rating_organization !== null);
        const avgOrg = withOrg.length ? withOrg.reduce((acc, s) => acc + (s.rating_organization ?? 0), 0) / withOrg.length : 0;

        const withAtt = sourceForStats.filter(s => s.rating_attention !== null);
        const avgAtt = withAtt.length ? withAtt.reduce((acc, s) => acc + (s.rating_attention ?? 0), 0) / withAtt.length : 0;

        const withWBA = sourceForStats.filter(s => s.would_buy_again !== null);
        const wbaYes = withWBA.filter(s => s.would_buy_again === 'Sí').length;
        const pctWBA = withWBA.length ? Math.round((wbaYes / withWBA.length) * 100) : 0;

        // Avg services ratings
        const avgServices: Record<string, number> = {};
        const serviceAccum: Record<string, { sum: number; count: number }> = {};
        sourceForStats.forEach(s => {
            if (s.services_ratings) {
                Object.entries(s.services_ratings).forEach(([svc, val]) => {
                    if (typeof val === 'number') {
                        if (!serviceAccum[svc]) serviceAccum[svc] = { sum: 0, count: 0 };
                        serviceAccum[svc].sum += val;
                        serviceAccum[svc].count++;
                    }
                });
            }
        });
        Object.entries(serviceAccum).forEach(([svc, { sum, count }]) => {
            avgServices[svc] = Math.round((sum / count) * 10) / 10;
        });

        const npsBase = withNps.length || 1;
        setStats({
            total: n,
            avg_general: Math.round(avgGeneral * 10) / 10,
            avg_nps: Math.round(avgNps * 10) / 10,
            pct_promoters: Math.round((promoters / npsBase) * 100),
            pct_neutral: Math.round((neutrals / npsBase) * 100),
            pct_detractors: Math.round((detractors / npsBase) * 100),
            avg_organization: Math.round(avgOrg * 10) / 10,
            avg_attention: Math.round(avgAtt * 10) / 10,
            pct_would_buy_again: pctWBA,
            avg_services: avgServices,
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
