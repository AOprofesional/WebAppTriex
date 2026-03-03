import { Tables } from '../types/database.types';
import { calculateTripStatus } from './dateUtils';

type Trip = Tables<'trips'>;

/**
 * Select the primary trip to display based on operational status priority.
 * Status is calculated from the trip dates, NOT from the DB column,
 * to ensure the UI always reflects reality regardless of DB state.
 *
 * Priority:
 * 1. EN_CURSO (trip currently in progress)
 * 2. PREVIO (upcoming trip, closest start_date)
 * 3. FINALIZADO (most recent end_date)
 *
 * @param trips - Array of trips to select from
 * @returns The primary trip, or null if no trips available
 */
export function selectPrimaryTrip(trips: Trip[]): Trip | null {
    if (!trips || trips.length === 0) return null;

    const today = new Date().toISOString().split('T')[0];

    // Calculate effective status from dates (always overrides DB status_operational)
    const tripsWithStatus = trips.map(t => ({
        trip: t,
        effectiveStatus: calculateTripStatus(t.start_date ?? '', t.end_date ?? ''),
    }));

    // Priority 1: EN_CURSO
    const enCurso = tripsWithStatus.find(t => t.effectiveStatus === 'EN_CURSO');
    if (enCurso) return enCurso.trip;

    // Priority 2: PREVIO with start_date >= today (closest)
    const previos = tripsWithStatus
        .filter(t => t.effectiveStatus === 'PREVIO' && (t.trip.start_date ?? '') >= today)
        .sort((a, b) => (a.trip.start_date ?? '').localeCompare(b.trip.start_date ?? ''));
    if (previos.length > 0) return previos[0].trip;

    // Priority 3: FINALIZADO with most recent end_date
    const finalizados = tripsWithStatus
        .filter(t => t.effectiveStatus === 'FINALIZADO')
        .sort((a, b) => (b.trip.end_date ?? '').localeCompare(a.trip.end_date ?? ''));
    if (finalizados.length > 0) return finalizados[0].trip;

    // Fallback: first trip
    return trips[0];
}
