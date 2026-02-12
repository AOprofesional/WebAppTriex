
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { useNotifications } from '../hooks/useNotifications';
import { PageLoading } from '../components/PageLoading';
import { usePassenger } from '../hooks/usePassenger';
import { useOrangePass } from '../hooks/useOrangePass';
import { formatPoints } from '../utils/orangePassHelpers';

import { NotificationDetailsModal } from '../components/NotificationDetailsModal';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { passenger } = usePassenger();
  const { redemptionHistory, pointsHistory } = useOrangePass(passenger?.id);
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

    const allItems = [
      ...notifications.map(n => ({ ...n, source: 'notification', sortDate: new Date(n.created_at || '') })),
      ...redemptionHistory.map(r => ({ ...r, source: 'redemption', sortDate: new Date(r.created_at || '') })),
      ...pointsHistory.map(p => ({ ...p, source: 'points', sortDate: new Date(p.created_at || '') }))
    ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    allItems.forEach(item => {
      const itemDate = item.sortDate;
      const itemDateStr = itemDate.toISOString().split('T')[0];

      let displayItem;

      if (item.source === 'notification') {
        const n = item as any;
        displayItem = {
          id: n.id,
          title: n.title,
          description: n.message,
          time: itemDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          icon: getIconForType(n.type),
          iconBg: getBgForType(n.type),
          iconColor: getColorForType(n.type),
          type: n.type,
          unread: !n.is_read,
          fullDate: itemDate,
          source: 'notification'
        };
      } else if (item.source === 'redemption') {
        const r = item as any;
        const isPending = r.status === 'PENDING';
        displayItem = {
          id: r.id,
          title: 'Solicitud de Canje',
          description: `Canje de ${formatPoints(r.points_amount)} puntos por ${r.type === 'NEXT_TRIP' ? 'descuento' : 'efectivo'}. Estado: ${r.status === 'PENDING' ? 'Pendiente' : r.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}`,
          time: itemDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          icon: 'redeem',
          iconBg: isPending ? 'bg-orange-50' : (r.status === 'APPROVED' ? 'bg-green-50' : 'bg-red-50'),
          iconColor: isPending ? 'text-orange-500' : (r.status === 'APPROVED' ? 'text-green-600' : 'text-red-500'),
          type: 'redemption',
          unread: false,
          fullDate: itemDate,
          source: 'redemption'
        };
      } else if (item.source === 'points') {
        const p = item as any;
        displayItem = {
          id: p.id,
          title: p.points > 0 ? 'Puntos Acreditados' : 'Puntos Debitados',
          description: `${p.points > 0 ? '+' : ''}${formatPoints(p.points)} puntos. ${p.reason === 'REFERRAL_PURCHASE' ? 'Por referido' : p.reason}`,
          time: itemDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          icon: 'stars',
          iconBg: 'bg-orange-50',
          iconColor: 'text-orange-500',
          type: 'points',
          unread: false,
          fullDate: itemDate,
          source: 'points'
        };
      }

      if (displayItem) {
        if (itemDateStr === todayStr) {
          todayItems.push(displayItem);
        } else if (itemDateStr === yesterdayStr) {
          yesterdayItems.push(displayItem);
        } else {
          const daysAgo = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
          const label = daysAgo < 7
            ? `HACE ${daysAgo} DÍA${daysAgo > 1 ? 'S' : ''}`
            : itemDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }).toUpperCase();

          if (!olderGroups.has(label)) {
            olderGroups.set(label, []);
          }
          olderGroups.get(label)!.push(displayItem);
        }
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
  }, [notifications, redemptionHistory, pointsHistory]);

  const handleNotificationClick = (notification: any) => {
    if (notification.source === 'notification' && notification.unread) {
      markAsRead(notification.id);
    }
    if (notification.source === 'notification') {
      setSelectedNotification(notification);
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
