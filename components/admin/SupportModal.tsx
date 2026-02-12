
import React from 'react';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleEmailSupport = () => {
        window.location.href = "mailto:soporte@triex.com?subject=Reporte de Problema - Triex Admin";
    };

    const handleWhatsAppSupport = () => {
        // Placeholder number, replace with actual support number
        window.open("https://wa.me/5491112345678", "_blank");
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transform scale-100 transition-transform duration-300">
                {/* Header */}
                <div className="px-6 py-4 bg-primary text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl">support_agent</span>
                        <h2 className="text-lg font-bold">Centro de Ayuda</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                        Selecciona el canal de comunicación según tu necesidad:
                    </p>

                    <div className="space-y-4">
                        {/* Email Option */}
                        <button
                            onClick={handleEmailSupport}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group group-hover:border-primary/50 text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-2xl">mail</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-zinc-800 dark:text-white text-base group-hover:text-primary transition-colors">
                                    Reportar un Problema
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    Envíanos un email con detalles del error o incidencia.
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 group-hover:text-primary">arrow_forward_ios</span>
                        </button>

                        {/* WhatsApp Option */}
                        <button
                            onClick={handleWhatsAppSupport}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-2xl">chat</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-zinc-800 dark:text-white text-base group-hover:text-green-600 transition-colors">
                                    Soporte Urgente
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    Contacta a la guardia técnica vía WhatsApp.
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 group-hover:text-green-600">arrow_forward_ios</span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 text-center border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-400">
                        Horario de atención estándar: Lunes a Viernes 9:00 - 18:00hs
                    </p>
                </div>
            </div>
        </div>
    );
};
