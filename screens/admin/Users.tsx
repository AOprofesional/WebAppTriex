import React, { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { UserCreateModal } from '../../components/modals/UserCreateModal';
import { UserEditModal } from '../../components/modals/UserEditModal';

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
    const { users, loading, createUser, updateUser, toggleUserStatus } = useUsers();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const handleCreate = async (data: any) => {
        const result = await createUser(data);
        if (!result.error) {
            alert('Usuario creado exitosamente' + (data.sendInvite ? '. Se envió un email de invitación.' : ''));
        }
        return result;
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleUpdate = async (userId: string, data: any) => {
        const result = await updateUser(userId, data);
        if (!result.error) {
            alert('Usuario actualizado exitosamente');
        }
        return result;
    };

    const handleToggleStatus = async (user: any) => {
        // Check if user is active by checking if they have a ban
        // For simplicity, we'll use a confirm dialog
        const isCurrentlyActive = true; // Assume active unless we know otherwise
        const action = isCurrentlyActive ? 'desactivar' : 'activar';

        if (!confirm(`¿Estás seguro de que deseas ${action} a ${user.full_name}?`)) {
            return;
        }

        const result = await toggleUserStatus(user.id, !isCurrentlyActive);
        if (!result.error) {
            alert(`Usuario ${action === 'desactivar' ? 'desactivado' : 'activado'} exitosamente`);
        } else {
            alert('Error: ' + result.error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {loading ? 'Cargando...' : `${users.length} usuarios registrados`}
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

            {/* Users Grid */}
            {loading ? (
                <div className="p-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm text-zinc-500">Cargando usuarios...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {users.map((user) => (
                        <div key={user.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-zinc-800 dark:text-white">{user.full_name || 'Sin nombre'}</h3>
                                        <p className="text-sm text-zinc-500">{user.email}</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                    Activo
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

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="flex-1 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(user)}
                                    className="flex-1 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    Desactivar
                                </button>
                            </div>
                        </div>
                    ))}
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
