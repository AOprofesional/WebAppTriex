
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Tables } from '../types/database.types';

type Notification = Tables<'notifications'>;

export const useNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    // Flag para saber si es el fetch inicial (muestra spinner) o un background refresh (silencioso)
    const isFirstFetch = useRef(true);

    useEffect(() => {
        if (!user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        isFirstFetch.current = true;
        fetchNotifications();

        // Resolve the passenger ID first, then subscribe to a filtered channel.
        // This prevents re-fetches triggered by notifications of OTHER passengers.
        let channel: ReturnType<typeof supabase.channel> | null = null;

        const setupChannel = async () => {
            const { data: passengerData } = await supabase
                .from('passengers')
                .select('id')
                .eq('profile_id', user.id)
                .maybeSingle();

            if (!passengerData?.id) return;

            const channelId = `notifications-${user.id}-${Math.random().toString(36).substring(7)}`;
            channel = supabase
                .channel(channelId)
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `passenger_id=eq.${passengerData.id}`,
                    },
                    () => {
                        isFirstFetch.current = false;
                        fetchNotifications();
                    }
                )
                .subscribe();
        };

        setupChannel();

        return () => { if (channel) supabase.removeChannel(channel); };
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            // Solo mostrar loading spinner en el primer fetch
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
            // Actualizar estado local inmediatamente (sin esperar realtime)
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            return { error: null };
        } catch (err: any) {
            console.error('Error marking all as read:', err);
            return { error: err.message };
        }
    };

    return { notifications, loading, error, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications };
};
