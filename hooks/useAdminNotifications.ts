
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

/** Returns the current user's role and uid from the profiles table. */
const getCurrentUserRole = async (): Promise<{ uid: string | null; role: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { uid: null, role: null };
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    return { uid: user.id, role: profile?.role ?? null };
};

export const useAdminNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const { sendEmail } = useEmailService();

    useEffect(() => {
        fetchAllNotifications();
    }, []);

    const fetchAllNotifications = async (
        page: number = 1,
        pageSize: number = 20,
        filters?: {
            type?: string;
            readStatus?: 'all' | 'read' | 'unread';
        }
    ) => {
        try {
            setLoading(true);
            setError(null);

            // Determine role so operators only see their passengers' notifications
            const { uid, role } = await getCurrentUserRole();

            let query = supabase
                .from('notifications')
                .select('*, passengers(first_name, last_name, email, assigned_to)', { count: 'exact' });

            // Scope to operator's assigned passengers
            if (role === 'operator' && uid) {
                const { data: assignedPassengers } = await supabase
                    .from('passengers')
                    .select('id')
                    .eq('assigned_to', uid)
                    .is('archived_at', null);
                const ids = (assignedPassengers || []).map(p => p.id);
                // If no passengers assigned, force empty result
                query = query.in('passenger_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']);
            }

            if (filters?.type && filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }

            if (filters?.readStatus === 'read') {
                query = query.eq('is_read', true);
            } else if (filters?.readStatus === 'unread') {
                query = query.eq('is_read', false);
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, count, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setNotifications(data || []);
            setTotalCount(count || 0);
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

            // Obtener email, nombre y profile_id del pasajero
            const { data: passenger } = await supabase
                .from('passengers')
                .select('email, first_name, profile_id')
                .eq('id', params.passengerId)
                .single();

            // Enviar push notification (no bloqueante)
            if (passenger?.profile_id) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    supabase.functions.invoke('send-push', {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        body: {
                            userId: passenger.profile_id,
                            title: params.title,
                            body: params.message,
                            url: '/#/notifications',
                        },
                    }).catch((pushErr) => console.warn('Push no enviado (notificación creada igual):', pushErr));
                }
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

            // Obtener emails, nombres y profile_ids para push + email masivo
            const { data: passengers } = await supabase
                .from('passengers')
                .select('email, first_name, profile_id')
                .in('id', params.passengerIds);

            if (passengers && passengers.length > 0) {
                const { data: { session } } = await supabase.auth.getSession();

                // Enviar push a todos los pasajeros con profile_id (no bloqueante)
                const profileIds = passengers
                    .map((p) => p.profile_id)
                    .filter(Boolean) as string[];

                if (profileIds.length > 0 && session) {
                    supabase.functions.invoke('send-push', {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        body: {
                            userIds: profileIds,
                            title: params.title,
                            body: params.message,
                            url: '/#/notifications',
                        },
                    }).catch((pushErr) => console.warn('Push masivo no enviado:', pushErr));
                }


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
            const { uid, role } = await getCurrentUserRole();

            let query = supabase
                .from('passengers')
                .select('id')
                .is('archived_at', null);

            // Operators only get their own assigned passengers
            if (role === 'operator' && uid) {
                query = query.eq('assigned_to', uid);
            }

            const { data, error: fetchError } = await query;
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
        totalCount,
        fetchAllNotifications,
        createNotification,
        createBulkNotifications,
        getTripPassengerIds,
        getAllPassengerIds,
    };
};
