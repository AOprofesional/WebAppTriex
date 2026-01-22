import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { supabase } from '../lib/supabase';

export const UpdatePassword: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if user came from password reset email
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('El enlace de recuperación ha expirado o es inválido.');
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        // Validar longitud mínima
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            console.error('Update password error:', err);
            setError(err.message || 'Error al actualizar la contraseña');
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
                            Nueva contraseña
                        </h1>
                        <p className="text-lg text-zinc-300 leading-relaxed">
                            Establece una contraseña segura para tu cuenta.
                        </p>

                        {/* Security Tips */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-base">check</span>
                                </div>
                                <div>
                                    <p className="font-ubuntu font-bold text-sm">Mínimo 8 caracteres</p>
                                    <p className="text-sm text-zinc-400">Usa una combinación segura</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-base">check</span>
                                </div>
                                <div>
                                    <p className="font-ubuntu font-bold text-sm">Contraseña única</p>
                                    <p className="text-sm text-zinc-400">No la uses en otros sitios</p>
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

            {/* Right Side - Update Password Form */}
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
                                <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                            </div>
                            <h2 className="font-ubuntu font-bold text-2xl text-triex-grey mb-2">
                                Contraseña actualizada
                            </h2>
                            <p className="text-zinc-500 mb-6">
                                Tu contraseña ha sido actualizada exitosamente. Serás redirigido al login en unos segundos.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-ubuntu font-bold py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">login</span>
                                Ir al login
                            </button>
                        </div>
                    ) : (
                        /* Update Password Form */
                        <>
                            {/* Form Header */}
                            <div className="text-center mb-8">
                                <h2 className="font-ubuntu font-bold text-3xl text-triex-grey mb-2">
                                    Establecer contraseña
                                </h2>
                                <p className="text-zinc-500">
                                    Ingresa tu nueva contraseña.
                                </p>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-5">
                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                                        <span className="material-symbols-outlined text-red-500 flex-shrink-0">error</span>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Password Input */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-ubuntu font-bold text-triex-grey mb-2"
                                    >
                                        Nueva contraseña
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                            lock
                                        </span>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 8 caracteres"
                                            required
                                            minLength={8}
                                            className="w-full pl-12 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-triex-grey placeholder:text-zinc-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-triex-grey transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Input */}
                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-ubuntu font-bold text-triex-grey mb-2"
                                    >
                                        Confirmar contraseña
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                            lock_reset
                                        </span>
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repite tu contraseña"
                                            required
                                            minLength={8}
                                            className="w-full pl-12 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-triex-grey placeholder:text-zinc-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-triex-grey transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-ubuntu font-bold py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mt-6"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            Actualizando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">check</span>
                                            Actualizar contraseña
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
