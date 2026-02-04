
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { useNotifications } from '../hooks/useNotifications';
import { PageLoading } from '../components/PageLoading';

import { NotificationDetailsModal } from '../components/NotificationDetailsModal';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [selectedNotification, setSelectedNotification] = React.useState<any | null>(null);

  // Group notifications by date
  const groupedNotifications = React.useMemo(() => {
    // ... existing grouping logic ...
    const groups: { title: string; items: any[] }[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todayItems: any[] = [];
    const yesterdayItems: any[] = [];
    const olderGroups: Map<string, any[]> = new Map();

    notifications.forEach(notification => {
      const notifDate = new Date(notification.created_at || '');
      const notifDateStr = notifDate.toISOString().split('T')[0];

      const item = {
        id: notification.id,
        title: notification.title,
        description: notification.message,
        time: notifDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        icon: getIconForType(notification.type),
        iconBg: getBgForType(notification.type),
        iconColor: getColorForType(notification.type),
        type: notification.type, // Added type property
        unread: !notification.is_read,
        fullDate: notifDate,
      };

      if (notifDateStr === todayStr) {
        todayItems.push(item);
      } else if (notifDateStr === yesterdayStr) {
        yesterdayItems.push(item);
      } else {
        const daysAgo = Math.floor((today.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24));
        const label = daysAgo < 7
          ? `HACE ${daysAgo} DÍA${daysAgo > 1 ? 'S' : ''}`
          : notifDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }).toUpperCase();

        if (!olderGroups.has(label)) {
          olderGroups.set(label, []);
        }
        olderGroups.get(label)!.push(item);
      }
    });

    if (todayItems.length > 0) {
      groups.push({ title: 'HOY', items: todayItems });
    }
    if (yesterdayItems.length > 0) {
      groups.push({ title: 'AYER', items: yesterdayItems });
    }
    olderGroups.forEach((items, label) => {
      groups.push({ title: label, items });
    });

    return groups;
  }, [notifications]);

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification);
    if (notification.unread) {
      markAsRead(notification.id);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-24 lg:pb-8">
      {/* Header Notifications */}
      <div className="px-5 py-6 flex items-center justify-between">
        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
          <img src={LOGO_URL} alt="Triex" className="h-4 brightness-0 opacity-40 dark:brightness-200" />
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="px-4 py-2 text-sm font-semibold text-primary hover:underline"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="px-5 mb-8">
        <h1 className="text-[34px] font-extrabold text-zinc-800 dark:text-white leading-tight">Notificaciones</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
          {unreadCount > 0
            ? `Tenés ${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} sin leer`
            : 'No tenés mensajes sin leer'}
        </p>
      </div>

      {groupedNotifications.length === 0 ? (
        <div className="px-5">
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-8 text-center border border-zinc-100 dark:border-zinc-800">
            <div className="w-16 h-16 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
              <span className="material-symbols-outlined text-3xl">notifications_none</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-2">
              No hay notificaciones
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Te avisaremos cuando haya novedades
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedNotifications.map((section) => (
            <div key={section.title} className="px-5">
              <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.2em] mb-4">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800/50 flex gap-5 relative group active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className={`w-14 h-14 ${item.iconBg} dark:bg-zinc-800 rounded-2xl flex items-center justify-center ${item.iconColor} shrink-0`}>
                      <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                    </div>
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-[16px]">{item.title}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[13px] mt-1 leading-snug line-clamp-2">
                        {item.description}
                      </p>
                      <p className="text-zinc-300 dark:text-zinc-600 text-[11px] font-bold mt-3 uppercase tracking-wider">
                        {item.time}
                      </p>
                    </div>
                    {item.unread && (
                      <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-white dark:ring-zinc-900"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coordinator Contact */}
      <div className="px-5 mt-12 mb-8">
        <button className="w-full py-5 bg-[#3D3935] dark:bg-zinc-800 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
          <span className="material-symbols-outlined text-2xl">support_agent</span>
          Contactar coordinador
        </button>
      </div>

      <NotificationDetailsModal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification}
      />
    </div>
  );
};

// Helper functions to map notification types to icons and colors
function getIconForType(type: string): string {
  const iconMap: Record<string, string> = {
    doc_approved: 'verified_user',
    doc_rejected: 'cancel',
    voucher_available: 'download_for_offline',
    trip_reminder: 'schedule',
    trip_update: 'flight_takeoff',
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error',
  };
  return iconMap[type] || 'notifications';
}

function getBgForType(type: string): string {
  const bgMap: Record<string, string> = {
    doc_approved: 'bg-green-50',
    doc_rejected: 'bg-red-50',
    voucher_available: 'bg-orange-50',
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-amber-50',
    info: 'bg-blue-50',
  };
  return bgMap[type] || 'bg-zinc-100';
}

function getColorForType(type: string): string {
  const colorMap: Record<string, string> = {
    doc_approved: 'text-green-600',
    doc_rejected: 'text-red-500',
    voucher_available: 'text-primary',
    success: 'text-green-600',
    error: 'text-red-500',
    warning: 'text-amber-600',
    info: 'text-blue-600',
  };
  return colorMap[type] || 'text-zinc-600';
}
