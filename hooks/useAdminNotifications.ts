
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';
import { useEmailService, buildGenericEmailHtml } from './useEmailService';

type Notification = Tables<'notifications'>;
// Manual type for notification inserts since TablesInsert doesn't exist in types
type NotificationInsert = Omit<Notification, 'id' | 'created_at' | 'is_read'> & {
    is_read?: boolean;
};

interface CreateNotificationParams {
    passengerId?: string;
    tripId?: string;
    type: string;
    title: string;
    message: string;
}

interface CreateBulkNotificationParams {
    passengerIds: string[];
    tripId?: string;
    type: string;
    title: string;
    message: string;
}

export const useAdminNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { sendEmail } = useEmailService();

    useEffect(() => {
        fetchAllNotifications();
    }, []);

    const fetchAllNotifications = async (filters?: {
        type?: string;
        readStatus?: 'all' | 'read' | 'unread';
        limit?: number;
    }) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('notifications')
                .select('*, passengers(first_name, last_name, email)')
                .order('created_at', { ascending: false });

            if (filters?.type && filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }

            if (filters?.readStatus === 'read') {
                query = query.eq('is_read', true);
            } else if (filters?.readStatus === 'unread') {
                query = query.eq('is_read', false);
            }

            if (filters?.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setNotifications(data || []);
            return { data, error: null };
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching all notifications:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const createNotification = async (params: CreateNotificationParams) => {
        try {
            if (!params.passengerId) {
                throw new Error('Passenger ID is required');
            }

            const notification: NotificationInsert = {
                passenger_id: params.passengerId,
                trip_id: params.tripId || null,
                type: params.type,
                title: params.title,
                message: params.message,
            };

            const { data, error: insertError } = await supabase
                .from('notifications')
                .insert(notification)
                .select()
                .single();

            if (insertError) throw insertError;

            // Obtener email y nombre del pasajero para enviar email
            const { data: passenger } = await supabase
                .from('passengers')
                .select('email, first_name')
                .eq('id', params.passengerId)
                .single();

            if (passenger?.email) {
                const html = buildGenericEmailHtml({
                    firstName: passenger.first_name || 'Pasajero',
                    title: params.title,
                    message: params.message,
                    type: params.type,
                });
                // Enviar email de forma no bloqueante (no lanzar error si falla)
                sendEmail({
                    to: passenger.email,
                    subject: params.title,
                    html,
                }).catch((emailErr) => console.warn('Email no enviado (notificación creada igual):', emailErr));
            }

            await fetchAllNotifications();
            return { data, error: null };
        } catch (err: any) {
            console.error('Error creating notification:', err);
            return { data: null, error: err.message };
        }
    };

    const createBulkNotifications = async (params: CreateBulkNotificationParams) => {
        try {
            if (!params.passengerIds || params.passengerIds.length === 0) {
                throw new Error('At least one passenger ID is required');
            }

            const notifications: NotificationInsert[] = params.passengerIds.map(passengerId => ({
                passenger_id: passengerId,
                trip_id: params.tripId || null,
                type: params.type,
                title: params.title,
                message: params.message,
            }));

            const { data, error: insertError } = await supabase
                .from('notifications')
                .insert(notifications)
                .select();

            if (insertError) throw insertError;

            // Obtener emails de todos los pasajeros para envío masivo
            const { data: passengers } = await supabase
                .from('passengers')
                .select('email, first_name')
                .in('id', params.passengerIds);

            if (passengers && passengers.length > 0) {
                // Enviar email a cada pasajero de forma no bloqueante
                passengers.forEach((passenger) => {
                    if (passenger.email) {
                        const html = buildGenericEmailHtml({
                            firstName: passenger.first_name || 'Pasajero',
                            title: params.title,
                            message: params.message,
                            type: params.type,
                        });
                        sendEmail({
                            to: passenger.email,
                            subject: params.title,
                            html,
                        }).catch((emailErr) => console.warn('Email no enviado para', passenger.email, emailErr));
                    }
                });
            }

            await fetchAllNotifications();
            return { data, error: null };
        } catch (err: any) {
            console.error('Error creating bulk notifications:', err);
            return { data: null, error: err.message };
        }
    };

    const getTripPassengerIds = async (tripId: string): Promise<string[]> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('trip_passengers')
                .select('passenger_id')
                .eq('trip_id', tripId);

            if (fetchError) throw fetchError;

            return (data || []).map(tp => tp.passenger_id);
        } catch (err: any) {
            console.error('Error fetching trip passengers:', err);
            return [];
        }
    };

    const getAllPassengerIds = async (): Promise<string[]> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('passengers')
                .select('id')
                .is('archived_at', null);

            if (fetchError) throw fetchError;

            return (data || []).map(p => p.id);
        } catch (err: any) {
            console.error('Error fetching all passengers:', err);
            return [];
        }
    };

    return {
        notifications,
        loading,
        error,
        fetchAllNotifications,
        createNotification,
        createBulkNotifications,
        getTripPassengerIds,
        getAllPassengerIds,
    };
};
