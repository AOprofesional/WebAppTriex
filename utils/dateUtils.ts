/**
 * Calculate trip operational status based on dates
 * @param startDate - Trip start date (ISO string or Date)
 * @param endDate - Trip end date (ISO string or Date)
 * @returns Status: PREVIO, EN_CURSO, or FINALIZADO
 */
export const calculateTripStatus = (
    startDate: string | Date,
    endDate: string | Date
): 'PREVIO' | 'EN_CURSO' | 'FINALIZADO' => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for fair comparison

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    if (now < start) {
        return 'PREVIO'; // Trip hasn't started yet
    } else if (now >= start && now <= end) {
        return 'EN_CURSO'; // Trip is ongoing
    } else {
        return 'FINALIZADO'; // Trip has ended
    }
};
