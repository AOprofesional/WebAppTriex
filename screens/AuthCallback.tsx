import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useClaim } from '../hooks/useClaim';

export const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { claimPassenger } = useClaim();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const run = async () => {
            try {
                // At this point, App.tsx already waited for SIGNED_IN before navigating here.
                // The session is guaranteed to be in localStorage. Just verify it.
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError || !session) {
                    setError('No se pudo establecer la sesión. El enlace puede haber expirado o ya fue utilizado. Por favor contacta soporte.');
                    return;
                }

                // Claim the passenger record (link auth user → passenger row)
                const result = await claimPassenger();

                // Read redirect destination stored by App.tsx before the page reload
                const redirectTo = sessionStorage.getItem('auth_redirect_to');
                sessionStorage.removeItem('auth_redirect_to');

                switch (result.status) {
                    case 'OK_LINKED':
                    case 'ALREADY_LINKED':
                        // Go to intended destination or app home
                        navigate(redirectTo && redirectTo !== '/auth/callback' ? redirectTo : '/app', { replace: true });
                        break;

                    case 'NOT_FOUND':
                        navigate('/pending', { replace: true });
                        break;

                    case 'CONFLICT':
                        setError('Este email ya está vinculado a otra cuenta. Por favor contacta soporte.');
                        break;

                    case 'ARCHIVED':
                        setError('Esta cuenta ha sido archivada y no puede acceder al sistema. Por favor contacta soporte.');
                        break;

                    case 'ERROR':
                    default:
                        setError(result.message || 'Error al configurar tu cuenta');
                }
            } catch (err: any) {
                setError(err.message || 'Error inesperado');
            }
        };

        run();
    }, [claimPassenger, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
                <div className="max-w-md bg-white dark:bg-zinc-800 rounded-2xl p-8 text-center border border-zinc-200 dark:border-zinc-700">
                    <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block">
                        error
                    </span>

                    <h1 className="text-2xl font-bold text-zinc-800 dark:text-white mb-3">
                        Error al configurar cuenta
                    </h1>

                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        {error}
                    </p>

                    <div className="space-y-3">
                        <a
                            href="https://wa.me/5492615908839?text=Hola,%20tengo%20un%20problema%20con%20mi%20cuenta"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
                        >
                            <span className="material-symbols-outlined">chat</span>
                            Contactar Soporte
                        </a>

                        <button
                            onClick={() => navigate('/login', { replace: true })}
                            className="w-full px-6 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
            <div className="text-center">
                <span className="material-symbols-outlined animate-spin text-5xl text-primary mb-4 block">
                    progress_activity
                </span>
                <h2 className="text-xl font-semibold text-zinc-800 dark:text-white mb-2">
                    Configurando tu cuenta
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Por favor espera un momento...
                </p>
            </div>
        </div>
    );
};
