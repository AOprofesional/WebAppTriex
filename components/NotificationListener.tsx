import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente global que escucha nuevas notificaciones en tiempo real
 * y muestra un toast flotante. Debe montarse una sola vez en la app.
 */
export const NotificationListener: React.FC = () => {
    const { user } = useAuth();
    const passengerIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!user?.id) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;
        let isMounted = true;

        const initializeListener = async () => {
            const { data } = await supabase
                .from('passengers')
                .select('id')
                .eq('profile_id', user.id)
                .maybeSingle();

            if (!isMounted) return;
            if (!data?.id) return;

            passengerIdRef.current = data.id;
            console.log('NotificationListener: Subscribing for passenger', data.id);

            channel = supabase
                .channel(`notification-listener-toast-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications' },
                    (payload) => {
                        const newNotif = payload.new as any;

                        // Solo mostrar si es para este pasajero
                        if (newNotif.passenger_id !== passengerIdRef.current) return;

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
                )
                .subscribe((status) => {
                    console.log('NotificationListener: Subscription status:', status);
                });
        };

        initializeListener();

        return () => {
            isMounted = false;
            if (channel) supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return null;
};
