import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const ProfileSelector: React.FC = () => {
    const { availablePassengers, switchPassenger, signOut, selectedPassengerId } = useAuth();

    if (!availablePassengers || availablePassengers.length <= 1) return null;
    if (selectedPassengerId !== null) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-[#E0592A]/10 text-[#E0592A] rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">group</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        ¿Quién va a usar la app?
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Selecciona el perfil con el que deseas ingresar
                    </p>
                </div>

                <div className="space-y-3">
                    {availablePassengers.map((p, index) => {
                        const isMain = p.parent_passenger_id === null && index === 0;
                        const roleLabel = isMain ? 'Pasajero Titular' : `Acompañante ${index === 0 ? 1 : index}`;
                        
                        return (
                            <button
                                key={p.id}
                                onClick={() => switchPassenger(p.id)}
                                className="w-full flex items-center p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-[#E0592A] hover:bg-[#E0592A]/5 transition-all text-left group shadow-sm"
                            >
                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:bg-[#E0592A] group-hover:text-white transition-colors mr-4 overflow-hidden">
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} alt={p.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-xl">person</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                                        {p.first_name} {p.last_name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {roleLabel}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined ml-auto text-zinc-300 dark:text-zinc-700 group-hover:text-[#E0592A] transition-colors">
                                    chevron_right
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
                    <button
                        onClick={signOut}
                        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px] mr-2">logout</span>
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
};
