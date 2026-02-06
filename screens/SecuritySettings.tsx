import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const SecuritySettings: React.FC = () => {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validatePassword = (): boolean => {
        setError('');

        if (!currentPassword) {
            setError('Ingresá tu contraseña actual');
            return false;
        }

        if (newPassword.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }

        return true;
    };

    const handleChangePassword = async () => {
        if (!validatePassword()) return;

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Verify current password by attempting to sign in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) {
                throw new Error('No se pudo obtener el email del usuario');
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                throw new Error('La contraseña actual es incorrecta');
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setTimeout(() => {
                navigate('/profile');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Error al cambiar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-20">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-zinc-950 sticky top-0 z-50 border-b border-zinc-100 dark:border-zinc-800">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1 -ml-1 text-zinc-800 dark:text-zinc-200"
                >
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </button>
                <h1 className="text-lg font-bold text-zinc-800 dark:text-white">
                    Seguridad y Privacidad
                </h1>
                <div className="w-8" />
            </div>

            {/* Content */}
            <div className="px-5 py-6 space-y-6">
                {/* Change Password Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6">
                    <h2 className="text-lg font-bold text-triex-grey dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">lock</span>
                        Cambiar Contraseña
                    </h2>

                    <div className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                Contraseña Actual
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white pr-12"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white pr-12"
                                    placeholder="••••••••"
                                />
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                Mínimo 8 caracteres
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                Confirmar Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white pr-12"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Show/Hide Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="flex items-center gap-2 text-sm text-primary font-semibold"
                        >
                            <span className="material-symbols-outlined text-lg">
                                {showPasswords ? 'visibility_off' : 'visibility'}
                            </span>
                            {showPasswords ? 'Ocultar' : 'Mostrar'} contraseñas
                        </button>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    ✓ Contraseña actualizada correctamente
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleChangePassword}
                            disabled={loading || success}
                            className="w-full py-3 bg-primary text-white rounded-2xl font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Cambiando...' : success ? 'Contraseña Cambiada' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </div>

                {/* Future Features (Disabled) */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden opacity-50">
                    <div className="flex items-center justify-between p-5 border-b border-zinc-50 dark:border-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-zinc-400">verified_user</span>
                            </div>
                            <div>
                                <p className="font-bold text-zinc-700 dark:text-zinc-300">
                                    Autenticación de Dos Factores
                                </p>
                                <p className="text-xs text-zinc-500">Próximamente</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-zinc-400">devices</span>
                            </div>
                            <div>
                                <p className="font-bold text-zinc-700 dark:text-zinc-300">
                                    Sesiones Activas
                                </p>
                                <p className="text-xs text-zinc-500">Próximamente</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
