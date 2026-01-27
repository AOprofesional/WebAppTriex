import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const ArchivedAccountScreen: React.FC = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    useEffect(() => {
        // Auto logout after showing message
        const timer = setTimeout(async () => {
            await signOut();
            navigate('/login', { replace: true });
        }, 5000);

        return () => clearTimeout(timer);
    }, [signOut, navigate]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
            <div className="max-w-md bg-white dark:bg-zinc-800 rounded-2xl p-8 text-center border-2 border-red-500 shadow-xl">
                {/* Icon */}
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-5xl">
                        block
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
                    Cuenta Archivada
                </h1>

                {/* Message */}
                <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                    Tu cuenta ha sido archivada y no tiene acceso al sistema.
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                    Si crees que esto es un error, por favor contacta a soporte.
                </p>

                {/* Warning Box */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <p className="text-xs text-red-700 dark:text-red-300">
                        Serás desconectado automáticamente en 5 segundos...
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <a
                        href="https://wa.me/5491112345678?text=Hola,%20mi%20cuenta%20está%20archivada"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
                    >
                        <span className="material-symbols-outlined">chat</span>
                        Contactar Soporte
                    </a>

                    <button
                        onClick={handleLogout}
                        className="w-full px-6 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
                    >
                        Cerrar Sesión Ahora
                    </button>
                </div>
            </div>
        </div>
    );
};
