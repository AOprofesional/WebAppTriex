
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';

type Notification = Tables<'notifications'>;

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();

        // Set up real-time subscription
        const channel = supabase
            .channel('notifications-changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications'
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // No user logged in - this is expected on login screen
                setNotifications([]);
                setUnreadCount(0);
                setLoading(false);
                return;
            }

            // Get passenger record for current user
            const { data: passenger, error: passengerError } = await supabase
                .from('passengers')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (passengerError) throw passengerError;
            if (!passenger) throw new Error('No passenger record found');

            // Fetch notifications for this passenger
            const { data, error: fetchError } = await supabase
                .from('notifications')
                .select('*')
                .eq('passenger_id', passenger.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.is_read).length);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (updateError) throw updateError;

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            return { error: null };
        } catch (err: any) {
            console.error('Error marking notification as read:', err);
            return { error: err.message };
        }
    };

    const markAllAsRead = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Get passenger record
            const { data: passenger, error: passengerError } = await supabase
                .from('passengers')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (passengerError) throw passengerError;

            // Mark all as read
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('passenger_id', passenger.id)
                .eq('is_read', false);

            if (updateError) throw updateError;

            // Update local state
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);

            return { error: null };
        } catch (err: any) {
            console.error('Error marking all as read:', err);
            return { error: err.message };
        }
    };

    return {
        notifications,
        loading,
        error,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
};
