
import React from 'react';

type TripStatusBadgeProps = {
    status: 'PREVIO' | 'EN_CURSO' | 'FINALIZADO';
    size?: 'sm' | 'md';
};

export const TripStatusBadge: React.FC<TripStatusBadgeProps> = ({ status, size = 'md' }) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
        PREVIO: {
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            text: 'text-blue-600 dark:text-blue-400',
            label: 'Previo',
        },
        EN_CURSO: {
            bg: 'bg-green-50 dark:bg-green-900/30',
            text: 'text-green-600 dark:text-green-400',
            label: 'En Curso',
        },
        FINALIZADO: {
            bg: 'bg-zinc-100 dark:bg-zinc-800',
            text: 'text-zinc-500 dark:text-zinc-400',
            label: 'Finalizado',
        },
    };

    const style = styles[status] || styles.PREVIO;
    const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs';

    return (
        <span className={`${sizeClasses} rounded-full font-bold ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
};
