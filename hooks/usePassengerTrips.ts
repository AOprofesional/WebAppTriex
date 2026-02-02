
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';

type Trip = Tables<'trips'>;
type TripRequirement = Tables<'trip_documents_requirements'>;
type PassengerDocument = Tables<'passenger_documents'>;
type Voucher = Tables<'vouchers'>;

export interface NextStep {
    type: 'DOCS' | 'VOUCHERS' | 'INFO' | 'CONTACT';
    title: string;
    detail: string;
    ctaLabel: string;
    ctaRoute: string;
}

export const usePassengerTrips = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [primaryTrip, setPrimaryTrip] = useState<Trip | null>(null);
    const [passenger, setPassenger] = useState<{ id: string; first_name: string; last_name: string } | null>(null);
    const [nextStep, setNextStep] = useState<NextStep | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPassengerTrips();
    }, []);

    const fetchPassengerTrips = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Get passenger record for current user
            const { data: passenger, error: passengerError } = await supabase
                .from('passengers')
                .select('id, first_name, last_name')
                .eq('profile_id', user.id)
                .single();

            if (passengerError) throw passengerError;
            if (!passenger) throw new Error('No passenger record found');

            setPassenger(passenger);

            // Get trips for this passenger
            const { data: tripPassengers, error: tpError } = await supabase
                .from('trip_passengers')
                .select('trip_id')
                .eq('passenger_id', passenger.id);

            if (tpError) throw tpError;

            if (!tripPassengers || tripPassengers.length === 0) {
                setTrips([]);
                setPrimaryTrip(null);
                setNextStep(null);
                return;
            }

            const tripIds = tripPassengers.map(tp => tp.trip_id);

            // Fetch full trip details
            const { data: tripsData, error: tripsError } = await supabase
                .from('trips')
                .select('*')
                .in('id', tripIds)
                .is('archived_at', null)
                .order('start_date', { ascending: true });

            if (tripsError) throw tripsError;

            setTrips(tripsData || []);

            // Get primary trip using getPrimaryTrip logic
            const primary = getPrimaryTrip(tripsData || []);
            setPrimaryTrip(primary);

            // Calculate next step for primary trip
            if (primary) {
                const calculatedNextStep = await calculateNextStep(primary, passenger.id);
                setNextStep(calculatedNextStep);
            } else {
                setNextStep(null);
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching passenger trips:', err);
        } finally {
            setLoading(false);
        }
    };

    const refetch = () => {
        fetchPassengerTrips();
    };

    return {
        trips,
        primaryTrip,
        passenger, // Expose passenger data
        nextStep,
        loading,
        error,
        refetch,
        // Legacy exports for backward compatibility
        activeTrip: primaryTrip,
        nextTrip: null,
    };
};

/**
 * Get primary trip with priority logic:
 * 1. EN_CURSO (trip happening now)
 * 2. PREVIO with start_date >= today (closest upcoming)
 * 3. FINALIZADO with most recent end_date
 */
function getPrimaryTrip(trips: Trip[]): Trip | null {
    if (!trips || trips.length === 0) return null;

    const today = new Date().toISOString().split('T')[0];

    // Priority 1: EN_CURSO
    const enCurso = trips.find(t => t.status_operational === 'EN_CURSO');
    if (enCurso) return enCurso;

    // Priority 2: PREVIO with start_date >= today (closest)
    const previos = trips
        .filter(t => t.status_operational === 'PREVIO' && t.start_date >= today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (previos.length > 0) return previos[0];

    // Priority 3: FINALIZADO with most recent end_date
    const finalizados = trips
        .filter(t => t.status_operational === 'FINALIZADO')
        .sort((a, b) => b.end_date.localeCompare(a.end_date));
    if (finalizados.length > 0) return finalizados[0];

    // Fallback: first trip
    return trips[0];
}

/**
 * Calculate next step with priority logic:
 * If override enabled: use override data
 * Else: DOCS > VOUCHERS > INFO > CONTACT > NONE
 */
async function calculateNextStep(trip: Trip, passengerId: string): Promise<NextStep | null> {
    // Check if manual override is enabled
    if (trip.next_step_override_enabled) {
        return {
            type: trip.next_step_type_override as any || 'INFO',
            title: trip.next_step_title_override || 'Próximo paso',
            detail: trip.next_step_detail_override || '',
            ctaLabel: trip.next_step_cta_label_override || 'Ver más',
            ctaRoute: trip.next_step_cta_route_override || '/mytrip',
        };
    }

    // Priority 1: DOCS - Check if there are pending documents
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

    // Priority 2: VOUCHERS - Check if trip has vouchers
    const hasVouchers = await checkHasVouchers(trip.id, passengerId);
    if (hasVouchers) {
        return {
            type: 'VOUCHERS',
            title: 'Ver tus vouchers',
            detail: 'Accedé a hotel, traslados y actividades.',
            ctaLabel: 'Ver vouchers',
            ctaRoute: '/travel-docs',
        };
    }

    // Priority 3: INFO - Check if has itinerary or includes/excludes
    if (trip.general_itinerary || trip.includes || trip.excludes) {
        return {
            type: 'INFO',
            title: 'Ver itinerario',
            detail: 'Revisá horarios y puntos importantes.',
            ctaLabel: 'Ver detalles',
            ctaRoute: '/mytrip',
        };
    }

    // Priority 4: CONTACT - Check if has coordinator
    if (trip.coordinator_name || trip.coordinator_phone) {
        return {
            type: 'CONTACT',
            title: 'Contactar coordinador',
            detail: 'Escribí por WhatsApp si necesitás ayuda.',
            ctaLabel: 'Contactar',
            ctaRoute: '/mytrip',
        };
    }

    // No next step available
    return null;
}

/**
 * Check if passenger has pending or missing required documents for trip
 */
async function checkPendingDocuments(tripId: string, passengerId: string): Promise<boolean> {
    try {
        // Get required documents for this trip
        const { data: requirements } = await supabase
            .from('trip_documents_requirements')
            .select('id')
            .eq('trip_id', tripId)
            .eq('is_required', true);

        if (!requirements || requirements.length === 0) return false;

        const requirementIds = requirements.map(r => r.id);

        // Get passenger's documents for these requirements
        const { data: passengerDocs } = await supabase
            .from('passenger_documents')
            .select('requirement_id, status')
            .eq('passenger_id', passengerId)
            .in('requirement_id', requirementIds);

        // Check if any required doc is missing or pending
        for (const req of requirements) {
            const doc = passengerDocs?.find(d => d.requirement_id === req.id);
            if (!doc || doc.status === 'PENDIENTE') {
                return true; // Has pending docs
            }
        }

        return false; // All required docs are uploaded
    } catch (error) {
        console.error('Error checking pending documents:', error);
        return false;
    }
}

/**
 * Check if trip or passenger has vouchers
 */
async function checkHasVouchers(tripId: string, passengerId: string): Promise<boolean> {
    try {
        const { data: vouchers } = await supabase
            .from('vouchers')
            .select('id')
            .or(`trip_id.eq.${tripId},passenger_id.eq.${passengerId}`)
            .is('archived_at', null)
            .limit(1);

        return (vouchers && vouchers.length > 0) || false;
    } catch (error) {
        console.error('Error checking vouchers:', error);
        return false;
    }
}
