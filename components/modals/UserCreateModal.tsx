import React, { useState } from 'react';
import { useRole } from '../../hooks/useRole';

interface UserCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: {
        email: string;
        full_name: string;
        role: 'operator' | 'admin' | 'superadmin';
        sendInvite: boolean;
    }) => Promise<{ error: string | null }>;
}

export const UserCreateModal: React.FC<UserCreateModalProps> = ({ isOpen, onClose, onCreate }) => {
    const { role: currentUserRole } = useRole();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'operator' | 'admin' | 'superadmin'>('operator');
    const [sendInvite, setSendInvite] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSuperAdmin = currentUserRole === 'superadmin';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!email.trim() || !fullName.trim()) {
            setError('Email y nombre completo son obligatorios');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Email inválido');
            return;
        }

        setLoading(true);
        const { error: createError } = await onCreate({
            email: email.trim(),
            full_name: fullName.trim(),
            role,
            sendInvite
        });

        setLoading(false);

        if (createError) {
            setError(createError);
        } else {
            // Success
            setEmail('');
            setFullName('');
            setRole('operator');
            setSendInvite(true);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-triex-grey dark:text-white">
                        Nuevo Usuario
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="usuario@triex.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Juan Pérez"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Rol *
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="operator">Operador</option>
                            <option value="admin">Administrador</option>
                            {isSuperAdmin && <option value="superadmin">Super Administrador</option>}
                        </select>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="send-invite"
                            type="checkbox"
                            checked={sendInvite}
                            onChange={(e) => setSendInvite(e.target.checked)}
                            className="w-4 h-4 text-primary bg-zinc-100 border-zinc-300 rounded focus:ring-primary focus:ring-2"
                        />
                        <label htmlFor="send-invite" className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Enviar email de invitación
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
