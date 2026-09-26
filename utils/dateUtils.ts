/**
 * Parse a date string in YYYY-MM-DD format as LOCAL time (not UTC).
 * Using `new Date("YYYY-MM-DD")` interprets the string as UTC midnight,
 * which in UTC-3 shows the previous day. This function avoids that offset.
 */
export const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // months are 0-indexed in JS
};

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
