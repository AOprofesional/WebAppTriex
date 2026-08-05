import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Tables } from '../types/database.types';

type Notification = Tables<'notifications'>;

interface NotificationsContextType {
    notifications: Notification[];
    loading: boolean;
    error: string | null;
    unreadCount: number;
    markAsRead: (notificationId: string) => Promise<{ error: string | null }>;
    markAllAsRead: () => Promise<{ error: string | null }>;
    refetch: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const isFirstFetch = useRef(true);
    // Track last seen notification IDs to detect genuinely new ones for toasts
    const knownNotifIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        isFirstFetch.current = true;
        knownNotifIds.current = new Set();
        fetchNotifications();

        let channel: ReturnType<typeof supabase.channel> | null = null;

        const setupChannel = async () => {
            const { data: passengerData } = await supabase
                .from('passengers')
                .select('id')
                .eq('profile_id', user.id)
                .maybeSingle();

            if (!passengerData?.id) return;

            // Nombre estable (sin Math.random) para evitar canales huérfanos acumulados
            const channelId = `notifications-ctx-${user.id}`;

            channel = supabase
                .channel(channelId)
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        // Filtro con passenger_id para que RLS de Supabase no rechace el canal
                        filter: `passenger_id=eq.${passengerData.id}`,
                    },
                    (payload) => {
                        // Si es un INSERT nuevo, mostrar toast flotante
                        if (payload.eventType === 'INSERT' && !isFirstFetch.current) {
                            const newNotif = payload.new as Notification;
                            if (!knownNotifIds.current.has(newNotif.id)) {
                                knownNotifIds.current.add(newNotif.id);
                                toast(`🔔  ${newNotif.title}`, {
                                    duration: 5000,
                                    position: 'top-right',
                                    style: {
                                        background: '#f97316',
                                        color: '#fff',
                                        borderRadius: '14px',
                                        padding: '14px 20px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        boxShadow: '0 4px 20px rgba(249, 115, 22, 0.45)',
                                        maxWidth: '340px',
                                    },
                                });
                            }
                        }
                        isFirstFetch.current = false;
                        fetchNotifications();
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        console.warn(`[NotificationsContext] Canal ${channelId} error:`, status, err?.message ?? '');
                    }
                });
        };

        setupChannel();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            if (isFirstFetch.current) {
                setLoading(true);
            }
            setError(null);

            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                setNotifications([]);
                setUnreadCount(0);
                return;
            }

            const { data: passenger } = await supabase
                .from('passengers')
                .select('id')
                .eq('profile_id', currentUser.id)
                .maybeSingle();

            if (!passenger) {
                setNotifications([]);
                setUnreadCount(0);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('notifications')
                .select('*')
                .eq('passenger_id', passenger.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const fresh = data || [];

            // Registrar IDs conocidos para evitar toasts duplicados en re-fetches
            fresh.forEach(n => knownNotifIds.current.add(n.id));

            setNotifications(fresh);
            setUnreadCount(fresh.filter(n => !n.is_read).length);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
            isFirstFetch.current = false;
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (updateError) throw updateError;
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            return { error: null };
        } catch (err: any) {
            console.error('Error marking notification as read:', err);
            return { error: err.message };
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return { error: null };

            const { data: passenger } = await supabase
                .from('passengers')
                .select('id')
                .eq('profile_id', currentUser.id)
                .maybeSingle();

            if (!passenger) return { error: null };

            const { error: updateError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('passenger_id', passenger.id)
                .eq('is_read', false);

            if (updateError) throw updateError;
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            return { error: null };
        } catch (err: any) {
            console.error('Error marking all as read:', err);
            return { error: err.message };
        }
    };

    return (
        <NotificationsContext.Provider value={{ notifications, loading, error, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications }}>
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotificationsContext = () => {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotificationsContext must be used within a NotificationsProvider');
    }
    return context;
};
