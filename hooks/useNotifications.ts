import { useNotificationsContext } from '../contexts/NotificationsContext';

export const useNotifications = () => {
    return useNotificationsContext();
};
