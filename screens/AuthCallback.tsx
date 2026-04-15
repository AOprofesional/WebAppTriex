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
                // 1. Wait for Supabase to fully establish the session from the URL token.
                //    getSession() is safe: it reads the token from the URL hash internally.
                let session = (await supabase.auth.getSession()).data.session;

                if (!session) {
                    // If not ready yet, wait for the SIGNED_IN event (up to 5 seconds)
                    session = await new Promise<typeof session>((resolve) => {
                        const timeout = setTimeout(() => resolve(null), 5000);
                        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
                            if (event === 'SIGNED_IN' && s) {
                                clearTimeout(timeout);
                                subscription.unsubscribe();
                                resolve(s);
                            }
                        });
                    });
                }

                if (!session) {
                    setError('No se pudo establecer la sesión. El enlace puede haber expirado. Por favor contacta soporte.');
                    return;
                }

                // 2. Claim the passenger record (link auth user → passenger row)
                const result = await claimPassenger();

                // 3. Read where we should redirect the user after claiming
                const redirectTo = sessionStorage.getItem('auth_redirect_to');
                sessionStorage.removeItem('auth_redirect_to');

                switch (result.status) {
                    case 'OK_LINKED':
                    case 'ALREADY_LINKED':
                        // Redirect to intended destination or fallback to home
                        navigate(redirectTo && redirectTo !== '/auth/callback' ? redirectTo : '/app', { replace: true });
                        break;

                    case 'NOT_FOUND':
                        // No passenger record for this email → pending screen
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
