
import React, { useState } from 'react';

// Mock Data
const mockUsers = [
    { id: 1, name: 'Admin Principal', email: 'admin@triex.com', role: 'administrador', status: 'activo', lastLogin: 'Hace 5 min' },
    { id: 2, name: 'María Operadora', email: 'maria.op@triex.com', role: 'operador', status: 'activo', lastLogin: 'Hace 2 horas' },
    { id: 3, name: 'Carlos Gestor', email: 'carlos.g@triex.com', role: 'operador', status: 'activo', lastLogin: 'Ayer' },
    { id: 4, name: 'Ana Soporte', email: 'ana.s@triex.com', role: 'operador', status: 'inactivo', lastLogin: 'Hace 1 semana' },
];

const permissions = {
    administrador: ['Dashboard', 'Pasajeros', 'Viajes', 'Vouchers', 'Puntos', 'Comunicaciones', 'Usuarios', 'Configuración'],
    operador: ['Dashboard', 'Pasajeros', 'Viajes', 'Vouchers', 'Puntos', 'Comunicaciones'],
};

export const AdminUsers: React.FC = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{mockUsers.length} usuarios registrados</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90"
                >
                    <span className="material-symbols-outlined text-xl">person_add</span>
                    Nuevo Usuario
                </button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockUsers.map((user) => (
                    <div key={user.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-800 dark:text-white">{user.name}</h3>
                                    <p className="text-sm text-zinc-500">{user.email}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.status === 'activo'
                                    ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Rol</span>
                                <span className={`font-semibold ${user.role === 'administrador' ? 'text-primary' : 'text-zinc-800 dark:text-white'}`}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Último acceso</span>
                                <span className="text-zinc-800 dark:text-white">{user.lastLogin}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-xs text-zinc-400 mb-2">Permisos:</p>
                            <div className="flex flex-wrap gap-1">
                                {permissions[user.role as keyof typeof permissions].slice(0, 4).map((perm) => (
                                    <span key={perm} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded">
                                        {perm}
                                    </span>
                                ))}
                                {permissions[user.role as keyof typeof permissions].length > 4 && (
                                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs rounded">
                                        +{permissions[user.role as keyof typeof permissions].length - 4}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <button className="flex-1 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                                Editar
                            </button>
                            <button className="flex-1 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                {user.status === 'activo' ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Roles Info */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                <h3 className="text-base font-bold text-zinc-800 dark:text-white mb-4">Roles y Permisos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                            <span className="font-semibold text-zinc-800 dark:text-white">Administrador</span>
                        </div>
                        <p className="text-sm text-zinc-500">Acceso completo a todas las funcionalidades del sistema incluyendo gestión de usuarios y configuración.</p>
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
        </div>
    );
};
