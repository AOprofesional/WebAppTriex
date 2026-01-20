
import React, { useState } from 'react';

// Mock Data
const mockNotifications = [
    { id: 1, title: 'Documento aprobado', message: 'Seguro de viaje de María González fue aprobado', type: 'success', time: 'Hace 5 min', read: false },
    { id: 2, title: 'Nuevo pasajero registrado', message: 'Juan Pérez fue agregado al viaje Bariloche', type: 'info', time: 'Hace 15 min', read: false },
    { id: 3, title: 'Documento pendiente', message: 'Carlos Rodríguez aún no cargó su pasaporte', type: 'warning', time: 'Hace 1 hora', read: true },
    { id: 4, title: 'Viaje confirmado', message: 'Viaje a Bariloche fue confirmado exitosamente', type: 'success', time: 'Hace 2 horas', read: true },
    { id: 5, title: 'Puntos asignados', message: '500 puntos fueron acreditados a Diego López', type: 'info', time: 'Hace 3 horas', read: true },
    { id: 6, title: 'Documento vencido', message: 'El seguro de Ana Martínez expiró ayer', type: 'error', time: 'Ayer', read: true },
];

const autoNotifications = [
    { event: 'Nuevo pasajero registrado', trigger: 'Al crear pasajero', enabled: true },
    { event: 'Documento cargado', trigger: 'Al subir archivo', enabled: true },
    { event: 'Documento aprobado', trigger: 'Al aprobar documento', enabled: true },
    { event: 'Viaje confirmado', trigger: 'Al confirmar viaje', enabled: true },
    { event: 'Recordatorio de documentos', trigger: '7 días antes del viaje', enabled: false },
    { event: 'Puntos acreditados', trigger: 'Al asignar puntos', enabled: true },
];

export const AdminCommunications: React.FC = () => {
    const [filter, setFilter] = useState('all');
    const [showConfig, setShowConfig] = useState(false);

    const typeStyles: Record<string, { icon: string; bg: string }> = {
        success: { icon: 'check_circle', bg: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
        info: { icon: 'info', bg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        warning: { icon: 'warning', bg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
        error: { icon: 'error', bg: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
    };

    const unreadCount = mockNotifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    >
                        <option value="all">Todas</option>
                        <option value="unread">Sin leer ({unreadCount})</option>
                        <option value="success">Exitosas</option>
                        <option value="warning">Advertencias</option>
                    </select>
                    {unreadCount > 0 && (
                        <button className="text-sm text-primary font-semibold hover:underline">
                            Marcar todas como leídas
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                    <span className="material-symbols-outlined text-xl">settings</span>
                    Configurar automáticas
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notifications List */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-white">Historial de Notificaciones</h2>
                    </div>
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                        {mockNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`px-6 py-4 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeStyles[notification.type].bg}`}>
                                    <span className="material-symbols-outlined">{typeStyles[notification.type].icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-zinc-800 dark:text-white">{notification.title}</p>
                                        {!notification.read && <span className="w-2 h-2 rounded-full bg-primary"></span>}
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{notification.message}</p>
                                </div>
                                <span className="text-xs text-zinc-400 shrink-0">{notification.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Auto Notifications Config */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-white">Notificaciones Automáticas</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {autoNotifications.map((auto, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                <div>
                                    <p className="text-sm font-medium text-zinc-800 dark:text-white">{auto.event}</p>
                                    <p className="text-xs text-zinc-500">{auto.trigger}</p>
                                </div>
                                <button className={`w-10 h-6 rounded-full transition-colors relative ${auto.enabled ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${auto.enabled ? 'left-5' : 'left-1'}`}></span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
