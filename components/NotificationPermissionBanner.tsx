import React, { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const NotificationPermissionBanner: React.FC = () => {
    const { permission, isSupported, isSubscribed, subscribe, loading } = usePushNotifications();
    const [dismissed, setDismissed] = useState(false);

    // Don't show if not supported, already subscribed, or dismissed
    if (!isSupported || isSubscribed || dismissed || permission === 'denied') {
        return null;
    }

    const handleEnable = async () => {
        const success = await subscribe();
        if (success) {
            setDismissed(true);
        }
    };

    return (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary">notifications</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-white mb-1">
                        Activa las notificaciones
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                        Recibe alertas importantes sobre tus documentos, viajes y vouchers directamente en tu navegador.
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleEnable}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Activando...' : 'Activar notificaciones'}
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        >
                            Ahora no
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
                >
                    <span className="material-symbols-outlined text-zinc-400 text-xl">close</span>
                </button>
            </div>
        </div>
    );
};
