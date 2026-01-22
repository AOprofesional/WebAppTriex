import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { supabase } from '../lib/supabase';

export const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validar que las contraseñas coincidan
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        // Validar longitud mínima de contraseña
        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                // Obtener el role del usuario
                const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');

                if (roleError) {
                    console.error('Error getting role:', roleError);
                    // Si hay error obteniendo el role, redirigir al home por defecto
                    navigate('/');
                    return;
                }

                // Redirigir según el role (nuevos usuarios son 'passenger' por defecto)
                if (roleData === 'admin' || roleData === 'operator') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Error al crear la cuenta');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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
                            Únete a la comunidad Triex
                        </h1>
                        <p className="text-lg text-zinc-300 leading-relaxed">
                            Crea tu cuenta y comienza a disfrutar de experiencias de viaje únicas.
                        </p>

                        {/* Features */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-base">stars</span>
                                </div>
                                <div>
                                    <p className="font-ubuntu font-bold text-sm">Viajes organizados</p>
                                    <p className="text-sm text-zinc-400">Todo planificado para que solo disfrutes</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-base">workspace_premium</span>
                                </div>
                                <div>
                                    <p className="font-ubuntu font-bold text-sm">Beneficios exclusivos</p>
                                    <p className="text-sm text-zinc-400">Acumula puntos y obtén recompensas</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-base">support_agent</span>
                                </div>
                                <div>
                                    <p className="font-ubuntu font-bold text-sm">Soporte 24/7</p>
                                    <p className="text-sm text-zinc-400">Asistencia durante todo tu viaje</p>
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

            {/* Right Side - Signup Form */}
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

                    {/* Form Header */}
                    <div className="text-center mb-8">
                        <h2 className="font-ubuntu font-bold text-3xl text-triex-grey mb-2">
                            Crear cuenta
                        </h2>
                        <p className="text-zinc-500">
                            Completa tus datos para comenzar tu aventura.
                        </p>
                    </div>

                    {/* Signup Form */}
                    <form onSubmit={handleSignup} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-500 flex-shrink-0">error</span>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Full Name Input */}
                        <div>
                            <label
                                htmlFor="fullName"
                                className="block text-sm font-ubuntu font-bold text-triex-grey mb-2"
                            >
                                Nombre completo
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                    person
                                </span>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Juan Pérez"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-triex-grey placeholder:text-zinc-400"
                                />
                            </div>
                        </div>

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
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="tu@email.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-triex-grey placeholder:text-zinc-400"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-ubuntu font-bold text-triex-grey mb-2"
                            >
                                Contraseña
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                    lock
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
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
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
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

                        {/* Submit Button - ACCIÓN PRINCIPAL */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-ubuntu font-bold py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mt-6"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    Creando cuenta...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">person_add</span>
                                    Crear cuenta
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-zinc-500">
                                ¿Ya tienes cuenta?
                            </span>
                        </div>
                    </div>

                    {/* Login Link - Secondary Action */}
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full border-2 border-triex-grey text-triex-grey hover:bg-triex-grey hover:text-white font-ubuntu font-bold py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">login</span>
                        Ingresar
                    </button>

                    {/* Help Text */}
                    <p className="mt-6 text-center text-sm text-zinc-500">
                        Al crear tu cuenta, aceptas nuestros{' '}
                        <button
                            onClick={() => navigate('/terms')}
                            className="text-primary hover:underline font-ubuntu font-bold"
                        >
                            Términos y Condiciones
                        </button>
                        {' '}y{' '}
                        <button
                            onClick={() => navigate('/privacy')}
                            className="text-primary hover:underline font-ubuntu font-bold"
                        >
                            Política de Privacidad
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
