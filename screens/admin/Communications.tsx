
import React, { useState, useEffect } from 'react';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { useAutoNotificationSettings } from '../../hooks/useAutoNotificationSettings';
import { CreateNotificationModal } from '../../components/admin/CreateNotificationModal';
import { Pagination } from '../../components/Pagination';

export const AdminCommunications: React.FC = () => {
    const { notifications, loading, fetchAllNotifications } = useAdminNotifications();
    const { settings: autoSettings, loading: settingsLoading, updateSetting } = useAutoNotificationSettings();
    const [filter, setFilter] = useState('all');
    const [showConfig, setShowConfig] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchAllNotifications({
            limit: 50,
        });
    }, []);

    const typeStyles: Record<string, { icon: string; bg: string }> = {
        success: { icon: 'check_circle', bg: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
        info: { icon: 'info', bg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        warning: { icon: 'warning', bg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
        error: { icon: 'error', bg: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
        doc_approved: { icon: 'check_circle', bg: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
        doc_rejected: { icon: 'cancel', bg: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
        voucher_available: { icon: 'download_for_offline', bg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        trip_reminder: { icon: 'schedule', bg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
        trip_update: { icon: 'flight_takeoff', bg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffMs = now.getTime() - notifTime.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays === 1) return 'Ayer';
        return `Hace ${diffDays} días`;
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        // Refresh notifications after modal closes
        fetchAllNotifications({ limit: 50 });
    };

    // Filter and paginate notifications
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.is_read;
        return n.type === filter;
    });

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
                        <option value="all">Todas ({notifications.length})</option>
                        <option value="unread">Sin leer ({unreadCount})</option>
                        <option value="success">Éxito</option>
                        <option value="warning">Advertencias</option>
                    </select>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                        <span className="material-symbols-outlined text-xl">settings</span>
                        Configurar automáticas
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90"
                    >
                        <span className="material-symbols-outlined text-xl">send</span>
                        Enviar Notificación
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notifications List */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-white">Historial de Notificaciones</h2>
                    </div>
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="px-6 py-12 text-center text-zinc-500">
                                Cargando notificaciones...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-6 py-12 text-center text-zinc-500">
                                No hay notificaciones aún
                            </div>
                        ) : (
                            notifications.map((notification: any) => {
                                const typeStyle = typeStyles[notification.type] || typeStyles.info;
                                return (
                                    <div
                                        key={notification.id}
                                        className={`px-6 py-4 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeStyle.bg}`}>
                                            <span className="material-symbols-outlined">{typeStyle.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-zinc-800 dark:text-white">{notification.title}</p>
                                                {!notification.is_read && <span className="w-2 h-2 rounded-full bg-primary"></span>}
                                            </div>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{notification.message}</p>
                                            {notification.passengers && (
                                                <p className="text-xs text-zinc-400 mt-1">
                                                    Para: {notification.passengers.first_name} {notification.passengers.last_name}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-zinc-400 shrink-0">{getTimeAgo(notification.created_at)}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Auto Notifications Config */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-white">Notificaciones Automáticas</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {settingsLoading ? (
                            <div className="py-8 text-center text-zinc-500 text-sm">
                                Cargando configuraciones...
                            </div>
                        ) : autoSettings.length === 0 ? (
                            <div className="py-8 text-center text-zinc-500 text-sm">
                                No hay configuraciones disponibles
                            </div>
                        ) : (
                            autoSettings.map((setting) => (
                                <div key={setting.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-800 dark:text-white">{setting.event_name}</p>
                                        <p className="text-xs text-zinc-500">{setting.trigger_description}</p>
                                    </div>
                                    <button
                                        onClick={() => updateSetting(setting.id, !setting.is_enabled)}
                                        className={`w-10 h-6 rounded-full transition-colors relative ${setting.is_enabled ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${setting.is_enabled ? 'left-5' : 'left-1'}`}></span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* CreateNotificationModal */}
            <CreateNotificationModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
            />

            {/* Pagination */}
            {!showConfig && (
                <Pagination
                    totalItems={filteredNotifications.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
};
