import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';
import { selectPrimaryTrip } from '../utils/tripSelection';
import { useAuth } from '../contexts/AuthContext';
import { queryCache } from '../lib/queryCache';

type Trip = Tables<'trips'>;
type TripRequirement = Tables<'trip_documents_requirements'>;
type PassengerDocument = Tables<'passenger_documents'>;
type Voucher = Tables<'vouchers'>;

export interface NextStep {
    type: 'DOCS' | 'INFO' | 'NONE';
    title: string;
    detail: string;
    ctaLabel: string | null;
    ctaRoute: string | null;
}

interface CachedPassengerTrips {
    trips: Trip[];
    primaryTrip: Trip | null;
    passenger: { id: string; first_name: string; last_name: string } | null;
    nextStep: NextStep | null;
}

export const usePassengerTrips = () => {
    const { user, selectedPassengerId } = useAuth();
    const cacheKey = `passenger_trips:${selectedPassengerId || user?.id || 'current'}`;

    // Read synchronously from cache for instant 0ms screen rendering
    const initialCache = queryCache.get<CachedPassengerTrips>(cacheKey);

    const [trips, setTrips] = useState<Trip[]>(initialCache?.data?.trips || []);
    const [primaryTrip, setPrimaryTrip] = useState<Trip | null>(initialCache?.data?.primaryTrip || null);
    const [passenger, setPassenger] = useState<{ id: string; first_name: string; last_name: string } | null>(
        initialCache?.data?.passenger || null
    );
    const [nextStep, setNextStep] = useState<NextStep | null>(initialCache?.data?.nextStep || null);
    const [loading, setLoading] = useState(!initialCache);
    const [error, setError] = useState<string | null>(null);
    const isFirstMount = useRef(true);

    const fetchPassengerTrips = async (force: boolean = false) => {
        try {
            const currentCache = queryCache.get<CachedPassengerTrips>(cacheKey);
            if (!currentCache?.data) {
                setLoading(true);
            }
            setError(null);

            // Get current user
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                setLoading(false);
                return;
            }

            let passengerData = null;

            if (selectedPassengerId) {
                const { data, error } = await supabase
                    .from('passengers')
                    .select('id, first_name, last_name')
                    .eq('id', selectedPassengerId)
                    .single();
                if (error) throw error;
                passengerData = data;
            } else {
                // Get passenger record — first by profile_id, then by email as fallback
                let { data, error } = await supabase
                    .from('passengers')
                    .select('id, first_name, last_name')
                    .eq('profile_id', currentUser.id)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                if (error) throw error;

                if (!data && currentUser.email) {
                    const { data: fallback, error: fbError } = await supabase
                        .from('passengers')
                        .select('id, first_name, last_name')
                        .eq('email', currentUser.email)
                        .is('parent_passenger_id', null)
                        .order('created_at', { ascending: true })
                        .limit(1)
                        .maybeSingle();

                    if (fbError) throw fbError;

                    if (fallback) {
                        data = fallback;
                        (async () => { await supabase.rpc('claim_passenger_by_email'); })();
                    }
                }
                passengerData = data;
            }

            if (!passengerData) {
                setTrips([]);
                setPrimaryTrip(null);
                setNextStep(null);
                setLoading(false);
                return;
            }

            setPassenger(passengerData);

            // Get trips for this passenger
            const { data: tripPassengers, error: tpError } = await supabase
                .from('trip_passengers')
                .select('trip_id')
                .eq('passenger_id', passengerData.id);

            if (tpError) throw tpError;

            let effectiveTripIds: string[] = tripPassengers?.map(tp => tp.trip_id) || [];

            // If this passenger (companion) has no trips of their own, look up the titular's trips
            if (effectiveTripIds.length === 0 && passengerData) {
                const { data: passengerFull, error: fullErr } = await supabase
                    .from('passengers')
                    .select('parent_passenger_id')
                    .eq('id', passengerData.id)
                    .maybeSingle();

                if (!fullErr && passengerFull?.parent_passenger_id) {
                    const { data: parentTrips, error: ptError } = await supabase
                        .from('trip_passengers')
                        .select('trip_id')
                        .eq('passenger_id', passengerFull.parent_passenger_id);

                    if (!ptError && parentTrips) {
                        effectiveTripIds = parentTrips.map(tp => tp.trip_id);
                    }
                }
            }

            if (effectiveTripIds.length === 0) {
                const emptyData: CachedPassengerTrips = {
                    trips: [],
                    primaryTrip: null,
                    passenger: passengerData,
                    nextStep: null,
                };
                setTrips([]);
                setPrimaryTrip(null);
                setNextStep(null);
                queryCache.set(cacheKey, emptyData);
                return;
            }

            // Fetch full trip details
            const { data: tripsData, error: tripsError } = await supabase
                .from('trips')
                .select('*, trip_passengers(count)')
                .in('id', effectiveTripIds)
                .is('archived_at', null)
                .order('start_date', { ascending: true });

            if (tripsError) throw tripsError;

            const fetchedTrips = tripsData || [];
            setTrips(fetchedTrips);

            // Get primary trip using selectPrimaryTrip logic
            const primary = selectPrimaryTrip(fetchedTrips);
            setPrimaryTrip(primary);

            // Calculate next step for primary trip
            let calculatedNextStep: NextStep | null = null;
            if (primary) {
                calculatedNextStep = await calculateNextStep(primary, passengerData.id);
                setNextStep(calculatedNextStep);
            } else {
                setNextStep(null);
            }

            // Store in cache for instant transitions
            const cachedResult: CachedPassengerTrips = {
                trips: fetchedTrips,
                primaryTrip: primary,
                passenger: passengerData,
                nextStep: calculatedNextStep,
            };
            queryCache.set(cacheKey, cachedResult);

        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching passenger trips:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cached = queryCache.get<CachedPassengerTrips>(cacheKey);
        if (cached?.data) {
            setTrips(cached.data.trips);
            setPrimaryTrip(cached.data.primaryTrip);
            setPassenger(cached.data.passenger);
            setNextStep(cached.data.nextStep);
            setLoading(false);

            if (cached.isFresh && isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }
        }

        isFirstMount.current = false;
        fetchPassengerTrips();
    }, [selectedPassengerId, user?.id]);

    const refetch = () => {
        fetchPassengerTrips(true);
    };

    return {
        trips,
        primaryTrip,
        passenger,
        nextStep,
        loading,
        error,
        refetch,
        activeTrip: primaryTrip,
        nextTrip: null,
    };
};

/**
 * Calculate next step based on trip status:
 * PREVIO: Check docs → Show "Cargar documentación" or "Todo listo"
 * EN_CURSO: Check actionable itinerary → Show "Ver itinerario" or "Sin acciones"
 * FINALIZADO: Show "Viaje finalizado"
 */
async function calculateNextStep(trip: Trip, passengerId: string): Promise<NextStep | null> {
    if (trip.next_step_override_enabled) {
        return {
            type: trip.next_step_type_override as any || 'INFO',
            title: trip.next_step_title_override || 'Próximo paso',
            detail: trip.next_step_detail_override || '',
            ctaLabel: trip.next_step_cta_label_override || null,
            ctaRoute: trip.next_step_cta_route_override || null,
        };
    }

    const status = trip.status_operational;

    if (status === 'PREVIO') {
        const hasPendingDocs = await checkPendingDocuments(trip.id, passengerId);

        if (hasPendingDocs) {
            return {
                type: 'DOCS',
                title: 'Cargar documentación',
                detail: 'Subí los documentos requeridos para tu viaje.',
                ctaLabel: 'Cargar ahora',
                ctaRoute: '/travel-docs',
            };
        }

        return {
            type: 'NONE',
            title: 'Todo listo por ahora',
            detail: 'Tu documentación está completa. Te avisaremos si necesitás realizar alguna acción antes del viaje.',
            ctaLabel: null,
            ctaRoute: null,
        };
    }

    if (status === 'EN_CURSO') {
        const hasActionableItinerary = await checkActionableItinerary(trip.id);

        if (hasActionableItinerary) {
            return {
                type: 'INFO',
                title: 'Ver itinerario',
                detail: 'Revisá horarios y puntos importantes.',
                ctaLabel: 'Ver detalles',
                ctaRoute: '/itinerary',
            };
        }

        return {
            type: 'NONE',
            title: 'No tenés acciones pendientes',
            detail: 'Disfrutá tu viaje. Te avisaremos si hay novedades.',
            ctaLabel: null,
            ctaRoute: null,
        };
    }

    if (status === 'FINALIZADO') {
        return {
            type: 'NONE',
            title: 'Viaje finalizado',
            detail: 'Gracias por viajar con nosotros.',
            ctaLabel: null,
            ctaRoute: null,
        };
    }

    return null;
}

/**
 * Check if passenger has pending or missing required documents for trip
 */
async function checkPendingDocuments(tripId: string, passengerId: string): Promise<boolean> {
    try {
        const { data: requirements } = await supabase
            .from('trip_documents_requirements')
            .select('id')
            .eq('trip_id', tripId)
            .eq('is_required', true);

        if (!requirements || requirements.length === 0) {
            return false;
        }

        const requirementIds = requirements.map(r => r.id);

        const { data: passengerDocs } = await supabase
            .from('passenger_documents')
            .select('required_document_id, status')
            .eq('passenger_id', passengerId)
            .in('required_document_id', requirementIds);

        for (const req of requirements) {
            const doc = passengerDocs?.find(d => d.required_document_id === req.id);
            if (!doc || doc.status === 'pending' || doc.status === 'rejected') {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking pending documents:', error);
        return false;
    }
}

/**
 * Check if trip has actionable itinerary items
 */
async function checkActionableItinerary(tripId: string): Promise<boolean> {
    try {
        const { data: items } = await supabase
            .from('trip_itinerary_items')
            .select('id')
            .eq('trip_id', tripId)
            .is('archived_at', null)
            .limit(1);

        return (items && items.length > 0) || false;
    } catch (error) {
        console.error('Error checking actionable itinerary:', error);
        return false;
    }
}
