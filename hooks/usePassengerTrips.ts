
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';
import { selectPrimaryTrip } from '../utils/tripSelection';

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
                .select('*, trip_passengers(count)')
                .in('id', tripIds)
                .is('archived_at', null)
                .order('start_date', { ascending: true });

            if (tripsError) throw tripsError;

            setTrips(tripsData || []);

            // Get primary trip using selectPrimaryTrip logic
            const primary = selectPrimaryTrip(tripsData || []);
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
 * Calculate next step based on trip status:
 * PREVIO: Check docs → Show "Cargar documentación" or "Todo listo"
 * EN_CURSO: Check actionable itinerary → Show "Ver itinerario" or "Sin acciones"
 * FINALIZADO: Show "Viaje finalizado"
 */
async function calculateNextStep(trip: Trip, passengerId: string): Promise<NextStep | null> {
    // Check if manual override is enabled
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

    // PREVIO: Only check documents
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

        // NONE: All docs complete
        return {
            type: 'NONE',
            title: 'Todo listo por ahora',
            detail: 'Tu documentación está completa. Te avisaremos si necesitás realizar alguna acción antes del viaje.',
            ctaLabel: null,
            ctaRoute: null,
        };
    }

    // EN_CURSO: Only check itinerary
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

        // NONE: No actionable items
        return {
            type: 'NONE',
            title: 'No tenés acciones pendientes',
            detail: 'Disfrutá tu viaje. Te avisaremos si hay novedades.',
            ctaLabel: null,
            ctaRoute: null,
        };
    }

    // FINALIZADO: Always NONE
    if (status === 'FINALIZADO') {
        return {
            type: 'NONE',
            title: 'Viaje finalizado',
            detail: 'Gracias por viajar con nosotros.',
            ctaLabel: null,
            ctaRoute: null,
        };
    }

    // Fallback for unknown status
    return null;
}

/**
 * Check if passenger has pending or missing required documents for trip
 */
async function checkPendingDocuments(tripId: string, passengerId: string): Promise<boolean> {
    try {
        // Get required documents for this trip
        const { data: requirements } = await supabase
            .from('required_documents')
            .select('id')
            .eq('trip_id', tripId)
            .eq('is_required', true);

        if (!requirements || requirements.length === 0) {
            console.log('DEBUG: No requirements found for trip:', tripId);
            return false;
        }

        const requirementIds = requirements.map(r => r.id);

        // Get passenger's documents for these requirements
        const { data: passengerDocs } = await supabase
            .from('passenger_documents')
            .select('required_document_id, status')
            .eq('passenger_id', passengerId)
            .in('required_document_id', requirementIds);

        // Check if any required doc is missing or pending
        for (const req of requirements) {
            const doc = passengerDocs?.find(d => d.required_document_id === req.id);
            console.log('DEBUG: checking req', req.id, 'status:', doc?.status);
            // Fix: Statuses are lowercase 'pending' (assigned) or 'rejected' (failed review)
            if (!doc || doc.status === 'pending' || doc.status === 'rejected') {
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

/**
 * Check if trip has actionable itinerary items
 * Note: Current schema doesn't have is_actionable or completed fields,
 * so we check if there are any itinerary items for the trip
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
