import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NotificationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: {
        id: string;
        title: string;
        description: string;
        type: string;
        time: string;
        fullDate: Date;
        icon: string;
        iconBg: string;
        iconColor: string;
    } | null;
}

export const NotificationDetailsModal: React.FC<NotificationDetailsModalProps> = ({ isOpen, onClose, notification }) => {
    const navigate = useNavigate();

    if (!isOpen || !notification) return null;

    const getAction = (type: string) => {
        switch (type) {
            case 'doc_pending':
                return { label: 'Subir documento', route: '/travel-docs', primary: true };
            case 'doc_rejected':
                return { label: 'Corregir documento', route: '/travel-docs', primary: true };
            case 'doc_approved':
                return { label: 'Ver mis documentos', route: '/travel-docs', primary: false };
            case 'voucher_available':
            case 'vouchers_available': // Support both singular and plural
                return { label: 'Ver mis vouchers', route: '/travel-docs', primary: true };
            case 'trip_update':
                return { label: 'Ver detalles del viaje', route: '/mytrip', primary: true };
            case 'trip_reminder':
                return { label: 'Ver itinerario', route: '/mytrip', primary: true };
            default:
                return null;
        }
    };

    const action = getAction(notification.type);

    const handleAction = () => {
        if (action?.route) {
            navigate(action.route);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200">

                {/* Header Pattern/Color */}
                <div className={`h-32 ${notification.iconBg} relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>

                    {/* Icon Bubble */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <div className={`w-20 h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center p-1.5 shadow-lg`}>
                            <div className={`w-full h-full ${notification.iconBg} rounded-full flex items-center justify-center`}>
                                <span className={`material-symbols-outlined text-4xl ${notification.iconColor}`}>
                                    {notification.icon}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/80 transition-colors"
                    >
                        <span className="material-symbols-outlined text-zinc-600 text-xl">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="pt-12 pb-8 px-8 text-center">
                    <h3 className="text-xl font-bold text-zinc-800 dark:text-white leading-tight mb-3">
                        {notification.title}
                    </h3>

                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                        {notification.description}
                    </p>

                    <div className="flex items-center justify-center gap-2 mb-8">
                        <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            {notification.fullDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-zinc-400 text-xs font-medium">
                            {notification.time}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        {action && (
                            <button
                                onClick={handleAction}
                                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2
                                    ${action.primary
                                        ? 'bg-primary text-white hover:bg-primary/90'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white hover:bg-zinc-200'
                                    }`}
                            >
                                {action.label}
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className={`w-full py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all
                                ${!action
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800'
                                    : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                }`}
                        >
                            {action ? 'Cerrar' : 'Entendido'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
