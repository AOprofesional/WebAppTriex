import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Pending: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
            <div className="max-w-md bg-white dark:bg-zinc-800 rounded-2xl p-8 text-center border border-zinc-200 dark:border-zinc-700 shadow-lg">
                <span className="material-symbols-outlined text-7xl text-amber-500 mb-4 block">
                    hourglass_empty
                </span>

                <h1 className="text-2xl font-bold text-zinc-800 dark:text-white mb-3">
                    Tu cuenta está creada
                </h1>

                <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                    Todavía no estás vinculado a un viaje o pasajero.
                    Nuestro equipo revisará tu solicitud pronto.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>¿Qué hacer ahora?</strong><br />
                        Contacta a nuestro equipo para acelerar tu vinculación al sistema.
                    </p>
                </div>

                <div className="space-y-3">
                    <a
                        href="https://wa.me/5491112345678?text=Hola,%20necesito%20ayuda%20con%20mi%20cuenta%20TRIEX"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
                    >
                        <span className="material-symbols-outlined">chat</span>
                        Contactar por WhatsApp
                    </a>

                    <a
                        href="mailto:soporte@triex.com?subject=Ayuda%20con%20mi%20cuenta"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all"
                    >
                        <span className="material-symbols-outlined">mail</span>
                        Enviar email
                    </a>

                    <button
                        onClick={() => navigate('/', { replace: true })}
                        className="w-full px-6 py-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white font-medium transition"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
};
