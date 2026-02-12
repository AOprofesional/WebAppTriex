import React, { useState, useMemo, useCallback } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { UserCreateModal } from '../../components/modals/UserCreateModal';
import { UserEditModal } from '../../components/modals/UserEditModal';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const PERMISSIONS = {
    superadmin: ['Dashboard', 'Pasajeros', 'Viajes', 'Vouchers', 'Documentos', 'Puntos', 'Comunicaciones', 'Usuarios', 'Configuración'],
    admin: ['Dashboard', 'Pasajeros', 'Viajes', 'Vouchers', 'Documentos', 'Puntos', 'Comunicaciones', 'Usuarios', 'Configuración'],
    operator: ['Dashboard', 'Pasajeros', 'Viajes', 'Vouchers', 'Documentos', 'Puntos', 'Comunicaciones'],
};

const formatLastLogin = (timestamp: string | null) => {
    if (!timestamp) return 'Nunca';

    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace menos de un minuto';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return then.toLocaleDateString('es-AR');
};

export const AdminUsers: React.FC = () => {
    const { users, loading, createUser, updateUser, deleteUser, toggleUserStatus, sendPasswordReset } = useUsers();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'name' | 'role' | 'date'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const USERS_PER_PAGE = 12;

    const handleCreate = async (data: any) => {
        const result = await createUser(data);
        if (!result.error) {
            const message = data.sendInvite
                ? 'Usuario creado exitosamente. Se envió un email de invitación.'
                : 'Usuario creado exitosamente';
            toast.success(message, { duration: 4000 });
        } else {
            toast.error(`Error al crear usuario: ${result.error}`, { duration: 5000 });
        }
        return result;
    };

    const handleEdit = useCallback((user: any) => {
        setSelectedUser(user);
        setShowEditModal(true);
    }, []);

    const handleUpdate = useCallback(async (userId: string, data: any) => {
        const result = await updateUser(userId, data);
        if (!result.error) {
            toast.success('Usuario actualizado exitosamente');
        } else {
            toast.error(`Error al actualizar usuario: ${result.error}`, { duration: 5000 });
        }
        return result;
    }, [updateUser]);

    const handleDelete = useCallback(async (user: any) => {
        // Verificar auto-eliminación
        const { data: currentUser } = await supabase.auth.getUser();
        if (user.id === currentUser.user?.id) {
            toast.error('No puedes eliminar tu propia cuenta');
            return;
        }

        // Verificar último superadmin
        if (user.role === 'superadmin') {
            const superAdminCount = users.filter(u => u.role === 'superadmin').length;
            if (superAdminCount === 1) {
                toast.error('No puedes eliminar el último Super Administrador');
                return;
            }
        }

        const confirmMessage = `⚠️ ADVERTENCIA: Esta acción es PERMANENTE\n\n¿Estás seguro de que deseas eliminar completamente a ${user.full_name}?\n\nEsta acción eliminará:\n- El usuario de la base de datos\n- Su perfil y toda la información asociada\n- NO puede ser revertida\n\n¿Deseas continuar?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        const result = await deleteUser(user.id);
        if (!result.error) {
            toast.success('Usuario eliminado exitosamente');
        } else {
            toast.error(`Error al eliminar usuario: ${result.error}`, { duration: 5000 });
        }
    }, [users, deleteUser]);

    const handleToggleStatus = useCallback(async (user: any) => {
        const action = user.banned_until ? 'desbloquear' : 'bloquear';
        if (!confirm(`¿Estás seguro de que deseas ${action} a ${user.full_name}?`)) {
            return;
        }

        const result = await toggleUserStatus(user.id, !user.banned_until);
        if (!result.error) {
            toast.success(`Usuario ${action === 'bloquear' ? 'bloqueado' : 'desbloqueado'} exitosamente`);
        } else {
            toast.error(`Error al cambiar estado: ${result.error}`, { duration: 5000 });
        }
    }, [toggleUserStatus]);

    const handleResetPassword = useCallback(async (user: any) => {
        if (!confirm(`¿Enviar email de restablecimiento de contraseña a ${user.email}?`)) {
            return;
        }

        const result = await sendPasswordReset(user.email!);
        if (!result.error) {
            toast.success('Email de restablecimiento enviado');
        } else {
            toast.error(`Error al enviar email: ${result.error}`, { duration: 5000 });
        }
    }, [sendPasswordReset]);

    const handleSort = useCallback((column: 'name' | 'role' | 'date') => {
        if (sortBy === column) {
            setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    }, [sortBy]);

    // Filtrar y buscar usuarios
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = !searchQuery ||
                user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRole = !roleFilter || user.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    // Paginación
    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * USERS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {loading ? 'Cargando...' : `${filteredUsers.length} de ${users.length} usuarios`}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90"
                    >
                        <span className="material-symbols-outlined text-xl">person_add</span>
                        Nuevo Usuario
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">📋 Todos los roles</option>
                        <option value="operator">👤 Operador</option>
                        <option value="admin">🔑 Administrador</option>
                        <option value="superadmin">⚡ Super Admin</option>
                    </select>
                </div>
            </div>

            {/* Users Grid */}
            {loading ? (
                <div className="p-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm text-zinc-500">Cargando usuarios...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedUsers.length === 0 ? (
                        <div className="col-span-2 p-12 text-center">
                            <p className="text-zinc-500">No se encontraron usuarios con los filtros aplicados</p>
                        </div>
                    ) : (
                        paginatedUsers.map((user) => (
                            <div key={user.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-zinc-800 dark:text-white">{user.full_name || 'Sin nombre'}</h3>
                                            <p className="text-sm text-zinc-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.banned_until
                                        ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        {user.banned_until ? 'Bloqueado' : 'Activo'}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">Rol</span>
                                        <span className={`font-semibold ${user.role === 'admin' || user.role === 'superadmin' ? 'text-primary' : 'text-zinc-800 dark:text-white'}`}>
                                            {user.role === 'superadmin' ? 'Super Administrador' : user.role === 'admin' ? 'Administrador' : 'Operador'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">Último acceso</span>
                                        <span className="text-zinc-800 dark:text-white">{formatLastLogin(user.last_sign_in_at)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-xs text-zinc-400 mb-2">Permisos:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {PERMISSIONS[user.role as keyof typeof PERMISSIONS].slice(0, 4).map((perm) => (
                                            <span key={perm} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded">
                                                {perm}
                                            </span>
                                        ))}
                                        {PERMISSIONS[user.role as keyof typeof PERMISSIONS].length > 4 && (
                                            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs rounded">
                                                +{PERMISSIONS[user.role as keyof typeof PERMISSIONS].length - 4}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="flex-1 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(user)}
                                            className="flex-1 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                            title="Resetear contraseña"
                                        >
                                            🔑 Reset
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg ${user.banned_until
                                                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                }`}
                                        >
                                            {user.banned_until ? 'Desbloquear' : 'Bloquear'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="flex-1 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                        Anterior
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium ${currentPage === page
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {/* Roles Info */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                <h3 className="text-base font-bold text-zinc-800 dark:text-white mb-4">Roles y Permisos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-purple-600">shield</span>
                            <span className="font-semibold text-zinc-800 dark:text-white">Super Administrador</span>
                        </div>
                        <p className="text-sm text-zinc-500">Acceso total incluyendo gestión de otros administradores.</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                            <span className="font-semibold text-zinc-800 dark:text-white">Administrador</span>
                        </div>
                        <p className="text-sm text-zinc-500">Acceso completo a todas las funcionalidades del sistema incluyendo gestión de usuarios.</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-blue-600">person</span>
                            <span className="font-semibold text-zinc-800 dark:text-white">Operador</span>
                        </div>
                        <p className="text-sm text-zinc-500">Acceso a gestión operativa de pasajeros, viajes, documentación y comunicaciones.</p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <UserCreateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreate}
            />
            <UserEditModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                user={selectedUser}
                onUpdate={handleUpdate}
            />
        </div>
    );
};
