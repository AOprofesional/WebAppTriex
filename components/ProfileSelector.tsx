import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const ProfileSelector: React.FC = () => {
    const { availablePassengers, switchPassenger, signOut, selectedPassengerId } = useAuth();

    if (!availablePassengers || availablePassengers.length <= 1) return null;
    if (selectedPassengerId !== null) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-[#E0592A]/10 text-[#E0592A] rounded-2xl flex items-center justify-center shadow-inner">
                            <span className="material-symbols-outlined text-3xl">diversity_3</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        ¿Quién va a usar la app?
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Selecciona el pasajero con el que deseas ingresar
                    </p>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {availablePassengers.map((p, index) => {
                        const isMain = !p.parent_passenger_id;
                        const roleLabel = isMain ? 'Pasajero Titular' : (p.parent_passenger_id ? 'Acompañante' : `Pasajero ${index + 1}`);

                        return (
                            <button
                                key={p.id}
                                onClick={() => switchPassenger(p.id)}
                                className="w-full flex items-center p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl hover:border-[#E0592A] hover:bg-[#E0592A]/5 dark:hover:bg-[#E0592A]/10 transition-all text-left group shadow-sm"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:bg-[#E0592A] group-hover:text-white transition-colors mr-4 overflow-hidden border border-zinc-200/50 dark:border-zinc-600/50 flex-shrink-0">
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} alt={p.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-2xl">
                                            {isMain ? 'person' : 'person_add'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-zinc-900 dark:text-white truncate text-base">
                                            {p.first_name} {p.last_name}
                                        </h3>
                                        <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                                            isMain 
                                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60' 
                                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800/60'
                                        }`}>
                                            {roleLabel}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                                        {p.document_type && p.document_number 
                                            ? `${p.document_type}: ${p.document_number}` 
                                            : (p.email ? `Email: ${p.email}` : 'Sin documento registrado')}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined ml-2 text-zinc-400 dark:text-zinc-500 group-hover:text-[#E0592A] group-hover:translate-x-0.5 transition-all">
                                    chevron_right
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
                    <button
                        onClick={signOut}
                        className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors py-1 px-3 rounded-lg"
                    >
                        <span className="material-symbols-outlined text-[18px] mr-1.5">logout</span>
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
};
