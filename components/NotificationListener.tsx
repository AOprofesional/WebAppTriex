import React from 'react';

/**
 * NotificationListener — DEPRECATED / NO-OP
 *
 * La lógica de suscripción Realtime y los toasts de nuevas notificaciones
 * fue consolidada en NotificationsContext (contexts/NotificationsContext.tsx)
 * para evitar canales WebSocket duplicados que causaban CHANNEL_ERROR.
 *
 * Este componente se mantiene como no-op para no romper imports existentes.
 */
export const NotificationListener: React.FC = () => null;
