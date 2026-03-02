import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InstallAppBanner: React.FC = () => {
    const { canInstall, promptInstall, dismiss } = usePWAInstall();

    if (!canInstall) return null;

    const handleInstall = async () => {
        const installed = await promptInstall();
        if (!installed) {
            // User dismissed the native dialog — hide banner for this session
            dismiss();
        }
    };

    return (
        <div className="fixed bottom-20 left-3 right-3 z-50 lg:bottom-6 lg:left-auto lg:right-6 lg:w-80 animate-slide-up">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                {/* Orange accent bar */}
                <div className="h-1 bg-gradient-to-r from-primary to-orange-400" />

                <div className="p-4">
                    <div className="flex items-start gap-3">
                        {/* App icon */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                            <img
                                src="https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/archivos-sistema/favicon-192.png"
                                alt="Triex"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-zinc-800 dark:text-white leading-tight">
                                Instalar Triex Viajes
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                                Agregá la app a tu pantalla de inicio para acceder más rápido
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={dismiss}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0 -mt-0.5"
                            aria-label="Cerrar"
                        >
                            <span className="material-symbols-outlined text-zinc-400 text-lg">close</span>
                        </button>
                    </div>

                    {/* Install button */}
                    <button
                        onClick={handleInstall}
                        className="mt-3 w-full py-2.5 bg-primary hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">install_mobile</span>
                        Instalar aplicación
                    </button>
                </div>
            </div>
        </div>
    );
};
