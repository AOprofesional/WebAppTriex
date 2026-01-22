import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { supabase } from '../lib/supabase';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#/update-password`,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            console.error('Reset password error:', err);

            // Manejo específico de errores comunes
            if (err.message?.toLowerCase().includes('rate limit')) {
                setError('Has intentado recuperar tu contraseña varias veces. Por seguridad, debes esperar unos minutos antes de volver a intentar.');
            } else if (err.message?.toLowerCase().includes('user not found')) {
                setError('No existe una cuenta con este correo electrónico.');
            } else if (err.message?.toLowerCase().includes('network')) {
                setError('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
            } else {
                setError(err.message || 'Error al enviar el correo de recuperación. Intenta nuevamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-triex-grey to-zinc-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    {/* Logo */}
                    <div>
                        <img
                            src={LOGO_URL}
                            alt="Triex Logo"
                            className="h-12 w-auto"
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-6 max-w-md">
                        <h1 className="font-ubuntu font-bold text-4xl leading-tight">
                            Recupera tu acceso
                        </h1>
                        <p className="text-lg text-zinc-300 leading-relaxed">
                            No te preocupes. Te enviaremos instrucciones para restablecer tu contraseña.
                        </p>

                        {/* Info */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
                                <div>
                                    <p className="font-ubuntu font-bold text-sm">Revisa tu bandeja de entrada</p>
                                    <p className="text-sm text-zinc-300">Recibirás un correo con un enlace para restablecer tu contraseña.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-sm text-zinc-400">
                        © 2026 Triex. Todos los derechos reservados.
                    </div>
                </div>
            </div>

            {/* Right Side - Reset Form */}
            <div className="flex-1 flex items-center justify-center bg-white p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <img
                            src={LOGO_URL}
                            alt="Triex Logo"
                            className="h-10 w-auto mx-auto"
                        />
                    </div>

                    {success ? (
                        /* Success Message */
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-green-600 text-3xl">mark_email_read</span>
                            </div>
                            <h2 className="font-ubuntu font-bold text-2xl text-triex-grey mb-2">
                                Correo enviado
                            </h2>
                            <p className="text-zinc-500 mb-6">
                                Revisa tu bandeja de entrada en <strong>{email}</strong>. Hemos enviado un enlace para restablecer tu contraseña.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-ubuntu font-bold py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                    Volver al login
                                </button>
                                <button
                                    onClick={() => {
                                        setSuccess(false);
                                        setEmail('');
                                    }}
                                    className="w-full text-zinc-600 hover:text-triex-grey font-ubuntu text-sm transition-colors"
                                >
                                    ¿No recibiste el correo? Reenviar
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Reset Form */
                        <>
                            {/* Form Header */}
                            <div className="text-center mb-8">
                                <h2 className="font-ubuntu font-bold text-3xl text-triex-grey mb-2">
                                    Recuperar contraseña
                                </h2>
                                <p className="text-zinc-500">
                                    Ingresa tu email y te enviaremos instrucciones.
                                </p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-6">
                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                                        <span className="material-symbols-outlined text-red-500 flex-shrink-0">error</span>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Email Input */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-ubuntu font-bold text-triex-grey mb-2"
                                    >
                                        Email
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                            mail
                                        </span>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu@email.com"
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-triex-grey placeholder:text-zinc-400"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-ubuntu font-bold py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">send</span>
                                            Enviar instrucciones
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Back to Login */}
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-sm text-triex-grey hover:text-primary font-ubuntu font-bold transition-colors inline-flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-base">arrow_back</span>
                                    Volver al login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
