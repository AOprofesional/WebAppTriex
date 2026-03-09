import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InstallAppBanner: React.FC = () => {
    const { canInstall, isIOS, installPrompt, promptInstall, dismiss } = usePWAInstall();

    if (!canInstall) return null;

    const handleInstall = async () => {
        const installed = await promptInstall();
        if (!installed) {
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
                                {isIOS
                                    ? 'Agregá la app a tu pantalla de inicio'
                                    : 'Accedé más rápido desde tu pantalla de inicio'}
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

                    {/* iOS Safari: instrucciones manuales */}
                    {isIOS ? (
                        <div className="mt-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 space-y-2">
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                Cómo instalar en Safari
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary text-xs font-bold">1</span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                                    Tocá el ícono{' '}
                                    <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                            <polyline points="16 6 12 2 8 6" />
                                            <line x1="12" y1="2" x2="12" y2="15" />
                                        </svg>
                                        Compartir
                                    </span>{' '}
                                    en la barra de Safari
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary text-xs font-bold">2</span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                                    Seleccioná{' '}
                                    <span className="font-semibold text-zinc-800 dark:text-white">
                                        "Agregar a pantalla de inicio"
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary text-xs font-bold">3</span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                                    Tocá{' '}
                                    <span className="font-semibold text-zinc-800 dark:text-white">"Agregar"</span>{' '}
                                    para confirmar
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Chrome/Android: botón nativo */
                        <button
                            onClick={handleInstall}
                            className="mt-3 w-full py-2.5 bg-primary hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">install_mobile</span>
                            Instalar aplicación
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
