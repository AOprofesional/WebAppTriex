import React, { useState, useEffect } from 'react';
import { useRole } from '../../hooks/useRole';

interface User {
    id: string;
    email: string | null;
    full_name: string | null;
    role: 'operator' | 'admin' | 'superadmin';
}

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUpdate: (userId: string, data: {
        full_name?: string;
        role?: 'operator' | 'admin' | 'superadmin';
    }) => Promise<{ error: string | null }>;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
    const { role: currentUserRole } = useRole();
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'operator' | 'admin' | 'superadmin'>('operator');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSuperAdmin = currentUserRole === 'superadmin';

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setRole(user.role);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!user) return;

        // Validation
        if (!fullName.trim()) {
            setError('Nombre completo es obligatorio');
            return;
        }

        setLoading(true);
        const { error: updateError } = await onUpdate(user.id, {
            full_name: fullName.trim(),
            role
        });

        setLoading(false);

        if (updateError) {
            setError(updateError);
        } else {
            // Success
            onClose();
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-triex-grey dark:text-white">
                        Editar Usuario
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
                            Email
                        </label>
                        <input
                            type="email"
                            value={user.email || ''}
                            disabled
                            className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-zinc-400 mt-1">El email no se puede modificar</p>
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
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
