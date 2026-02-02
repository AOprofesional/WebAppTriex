import React from 'react';
import { LOGO_URL } from '../constants';

interface PageLoadingProps {
    message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ message = 'Preparando tu viaje...' }) => {
    return (
        <div className="fixed inset-0 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center z-50">
            <div className="relative mb-8">
                {/* Pulsing ring effect */}
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div className="relative w-24 h-24 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-xl border border-zinc-100 dark:border-zinc-800">
                    <img
                        src={LOGO_URL}
                        alt="Triex"
                        className="w-12 h-12 object-contain brightness-0 dark:brightness-200 opacity-80 animate-pulse"
                    />
                </div>

                {/* Floating plane icon */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#E0592A] text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <span className="material-symbols-outlined text-sm">flight_takeoff</span>
                </div>
            </div>

            <div className="flex flex-col items-center space-y-2">
                <h3 className="text-xl font-bold text-triex-grey dark:text-white tracking-tight">
                    {message}
                </h3>
                <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
};
