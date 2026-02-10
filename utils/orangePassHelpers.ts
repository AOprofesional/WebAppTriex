// Orange Pass Helper Functions and Constants

export type TripCategory =
    | 'BRASIL_ANDINOS'
    | 'CARIBE'
    | 'USA_CANADA'
    | 'EUROPA'
    | 'EXOTICOS'
    | 'OTRO';

export const TRIP_CATEGORY_POINTS_MAP: Record<TripCategory, number> = {
    BRASIL_ANDINOS: 10,
    CARIBE: 20,
    USA_CANADA: 30,
    EUROPA: 40,
    EXOTICOS: 40,
    OTRO: 0,
};

export const TRIP_CATEGORY_LABELS: Record<TripCategory, string> = {
    BRASIL_ANDINOS: 'Brasil y Andinos',
    CARIBE: 'Caribe',
    USA_CANADA: 'Estados Unidos y Canadá',
    EUROPA: 'Europa',
    EXOTICOS: 'Destinos Exóticos',
    OTRO: 'Otro',
};

/**
 * Get human-readable label for a trip category
 */
export function getCategoryLabel(category: TripCategory | string | null): string {
    if (!category) return 'Sin categoría';
    return TRIP_CATEGORY_LABELS[category as TripCategory] || category;
}

/**
 * Calculate points for a given trip category
 */
export function calculatePointsForCategory(category: TripCategory | string | null): number {
    if (!category) return 0;
    return TRIP_CATEGORY_POINTS_MAP[category as TripCategory] || 0;
}

/**
 * Check if points have expired (more than 12 months old)
 */
export function isPointsExpired(creditedAt: string): boolean {
    const credited = new Date(creditedAt);
    const expirationDate = new Date(credited);
    expirationDate.setMonth(expirationDate.getMonth() + 12);
    return new Date() > expirationDate;
}

/**
 * Calculate expiration date (12 months from credited date)
 */
export function calculateExpirationDate(creditedAt: Date | string): Date {
    const credited = typeof creditedAt === 'string' ? new Date(creditedAt) : creditedAt;
    const expiration = new Date(credited);
    expiration.setMonth(expiration.getMonth() + 12);
    return expiration;
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
    return points.toLocaleString('es-AR');
}

/**
 * Generate a friendly expiration message
 */
export function getExpirationMessage(expiresAt: string): string {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
        return 'Expirados';
    } else if (daysUntilExpiration === 0) {
        return 'Expiran hoy';
    } else if (daysUntilExpiration === 1) {
        return 'Expiran mañana';
    } else if (daysUntilExpiration <= 30) {
        return `Expiran en ${daysUntilExpiration} días`;
    } else {
        const monthsUntilExpiration = Math.floor(daysUntilExpiration / 30);
        if (monthsUntilExpiration === 1) {
            return 'Expiran en 1 mes';
        }
        return `Expiran en ${monthsUntilExpiration} meses`;
    }
}
