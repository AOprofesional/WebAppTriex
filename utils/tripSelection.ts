import { Tables } from '../types/database.types';

type Trip = Tables<'trips'>;

/**
 * Select the primary trip to display based on operational status priority:
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
