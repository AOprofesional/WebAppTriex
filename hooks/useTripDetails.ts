import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';
import { selectPrimaryTrip } from '../utils/tripSelection';
import { calculateTripStatus } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { queryCache } from '../lib/queryCache';

type Trip = Tables<'trips'>;
type Voucher = Tables<'vouchers'>;
type DocRequirement = Tables<'trip_documents_requirements'>;

type TripDetails = {
    trip: Trip | null;
    passenger: { id: string } | null;
    vouchers: Voucher[];
    documentRequirements: DocRequirement[];
};

export const useTripDetails = (tripId?: string) => {
    const { user, selectedPassengerId } = useAuth();
    const cacheKey = `trip_details:${tripId || 'active'}:${selectedPassengerId || user?.id || 'current'}`;

    // Read synchronously from cache for instant 0ms screen rendering
    const initialCache = queryCache.get<TripDetails>(cacheKey);

    const [data, setData] = useState<TripDetails>(initialCache?.data || {
        trip: null,
        passenger: null,
        vouchers: [],
        documentRequirements: [],
    });
    const [loading, setLoading] = useState(!initialCache);
    const [error, setError] = useState<string | null>(null);
    const isFirstMount = useRef(true);

    const fetchActiveTrip = async (force: boolean = false) => {
        try {
            const currentCache = queryCache.get<TripDetails>(cacheKey);
            if (!currentCache?.data) {
                setLoading(true);
            }
            setError(null);

            // Get current user
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) throw new Error('No authenticated user');

            // Get passenger record
            let passengerData: { id: string; parent_passenger_id?: string | null } | null = null;
            
            if (selectedPassengerId) {
                const { data: pax } = await supabase
                    .from('passengers')
                    .select('id, parent_passenger_id')
                    .eq('id', selectedPassengerId)
                    .single();
                passengerData = pax;
            } else {
                const { data: pax } = await supabase
                    .from('passengers')
                    .select('id, parent_passenger_id')
                    .eq('profile_id', currentUser.id)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle();
                passengerData = pax;

                // Fallback: buscar por email si no tiene profile_id vinculado aún
                if (!passengerData && currentUser.email) {
                    const { data: fallback } = await supabase
                        .from('passengers')
                        .select('id, parent_passenger_id')
                        .eq('email', currentUser.email)
                        .is('parent_passenger_id', null)
                        .order('created_at', { ascending: true })
                        .limit(1)
                        .maybeSingle();

                    if (fallback) {
                        passengerData = fallback;
                        (async () => { await supabase.rpc('claim_passenger_by_email'); })();
                    }
                }
            }

            if (!passengerData) {
                setLoading(false);
                return;
            }

            // Get trip IDs for this passenger
            const { data: tripPassengers } = await supabase
                .from('trip_passengers')
                .select('trip_id')
                .eq('passenger_id', passengerData.id);

            let effectiveTripIds: string[] = tripPassengers?.map(tp => tp.trip_id) || [];

            // If companion has no trips of their own, inherit from parent passenger!
            if (effectiveTripIds.length === 0 && passengerData) {
                const parentId = passengerData.parent_passenger_id;
                if (parentId) {
                    const { data: parentTrips } = await supabase
                        .from('trip_passengers')
                        .select('trip_id')
                        .eq('passenger_id', parentId);

                    if (parentTrips && parentTrips.length > 0) {
                        effectiveTripIds = parentTrips.map(tp => tp.trip_id);
                    }
                } else {
                    // Check if parent_passenger_id exists in DB
                    const { data: passengerFull } = await supabase
                        .from('passengers')
                        .select('parent_passenger_id')
                        .eq('id', passengerData.id)
                        .maybeSingle();

                    if (passengerFull?.parent_passenger_id) {
                        const { data: parentTrips } = await supabase
                            .from('trip_passengers')
                            .select('trip_id')
                            .eq('passenger_id', passengerFull.parent_passenger_id);

                        if (parentTrips && parentTrips.length > 0) {
                            effectiveTripIds = parentTrips.map(tp => tp.trip_id);
                        }
                    }
                }
            }

            if (effectiveTripIds.length === 0) {
                const emptyResult: TripDetails = {
                    trip: null,
                    passenger: { id: passengerData.id },
                    vouchers: [],
                    documentRequirements: [],
                };
                setData(emptyResult);
                queryCache.set(cacheKey, emptyResult);
                setLoading(false);
                return;
            }

            // Fetch all trips for this passenger
            const { data: trips } = await supabase
                .from('trips')
                .select('*')
                .in('id', effectiveTripIds)
                .is('archived_at', null)
                .order('start_date', { ascending: true });

            if (!trips || trips.length === 0) {
                setLoading(false);
                return;
            }

            // Use selectPrimaryTrip for consistent selection across Home and MyTrip
            const primaryTrip = selectPrimaryTrip(trips);

            if (primaryTrip) {
                await fetchTripDetails(primaryTrip.id, passengerData.id);
            } else {
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching active trip:', err.message);
            setLoading(false);
        }
    };

    const fetchTripDetails = async (id: string, passengerIdArg?: string) => {
        try {
            const currentCache = queryCache.get<TripDetails>(cacheKey);
            if (!currentCache?.data) {
                setLoading(true);
            }
            setError(null);

            // Fetch trip
            const { data: trip, error: tripError } = await supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single();

            if (tripError) throw tripError;

            // Get current user (to filter vouchers)
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            let passengerId: string | null = null;

            if (currentUser) {
                if (selectedPassengerId) {
                    const { data: pax } = await supabase
                        .from('passengers')
                        .select('id')
                        .eq('id', selectedPassengerId)
                        .single();
                    passengerId = passengerIdArg || pax?.id || null;
                } else {
                    const { data: pax } = await supabase
                        .from('passengers')
                        .select('id')
                        .eq('profile_id', currentUser.id)
                        .order('created_at', { ascending: true })
                        .limit(1)
                        .single();
                    passengerId = passengerIdArg || pax?.id || null;
                }
            }

            // Fetch vouchers (Filtered by passenger if available)
            let vouchersQuery = supabase
                .from('vouchers')
                .select('*')
                .eq('trip_id', id)
                .is('archived_at', null)
                .order('created_at', { ascending: false });

            if (passengerId) {
                const { data: currentPax } = await supabase
                    .from('passengers')
                    .select('parent_passenger_id')
                    .eq('id', passengerId)
                    .maybeSingle();

                if (currentPax?.parent_passenger_id) {
                    vouchersQuery = vouchersQuery.or(`passenger_id.eq.${passengerId},passenger_id.eq.${currentPax.parent_passenger_id},passenger_id.is.null,visibility.eq.all_trip_passengers`);
                } else {
                    vouchersQuery = vouchersQuery.or(`passenger_id.eq.${passengerId},passenger_id.is.null,visibility.eq.all_trip_passengers`);
                }
            }

            const { data: vouchers, error: vouchersError } = await vouchersQuery;
            if (vouchersError) throw vouchersError;

            // Fetch document requirements
            const { data: documentRequirements, error: docsError } = await supabase
                .from('trip_documents_requirements')
                .select('*')
                .eq('trip_id', id)
                .is('archived_at', null)
                .order('is_required', { ascending: false });

            if (docsError) throw docsError;

            const tripWithCalculatedStatus = trip ? {
                ...trip,
                status_operational: calculateTripStatus(trip.start_date ?? '', trip.end_date ?? '')
            } : null;

            const result: TripDetails = {
                trip: tripWithCalculatedStatus,
                passenger: passengerId ? { id: passengerId } : null,
                vouchers: vouchers || [],
                documentRequirements: documentRequirements || [],
            };

            setData(result);
            queryCache.set(cacheKey, result);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching trip details:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cached = queryCache.get<TripDetails>(cacheKey);
        if (cached?.data) {
            setData(cached.data);
            setLoading(false);

            if (cached.isFresh && isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }
        }

        isFirstMount.current = false;
        if (tripId) {
            fetchTripDetails(tripId);
        } else {
            fetchActiveTrip();
        }
    }, [tripId, selectedPassengerId, user?.id]);

    return {
        ...data,
        loading,
        error,
        refetch: () => {
            if (data.trip) {
                fetchTripDetails(data.trip.id);
            } else {
                fetchActiveTrip(true);
            }
        },
    };
};
