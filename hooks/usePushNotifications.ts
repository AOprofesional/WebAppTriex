import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PushNotificationState {
    permission: NotificationPermission;
    isSupported: boolean;
    isSubscribed: boolean;
    subscription: PushSubscription | null;
}

export const usePushNotifications = () => {
    const { user } = useAuth();
    const [state, setState] = useState<PushNotificationState>({
        permission: 'default',
        isSupported: false,
        isSubscribed: false,
        subscription: null
    });
    const [loading, setLoading] = useState(false);

    // Check if push notifications are supported
    useEffect(() => {
        const checkSupport = async () => {
            const isSupported =
                'serviceWorker' in navigator &&
                'PushManager' in window &&
                'Notification' in window;

            setState(prev => ({
                ...prev,
                isSupported,
                permission: isSupported ? Notification.permission : 'denied'
            }));

            if (isSupported && user) {
                // Check if already subscribed
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setState(prev => ({
                    ...prev,
                    isSubscribed: !!subscription,
                    subscription
                }));
            }
        };

        checkSupport();
    }, [user]);

    // Request notification permission
    const requestPermission = async (): Promise<boolean> => {
        if (!state.isSupported) {
            alert('Las notificaciones push no están soportadas en este navegador');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            setState(prev => ({ ...prev, permission }));
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    };

    // Subscribe to push notifications
    const subscribe = async (): Promise<boolean> => {
        if (!state.isSupported || !user) {
            return false;
        }

        try {
            setLoading(true);

            // Request permission if not granted
            if (state.permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) return false;
            }

            // Get VAPID public key from server
            const { data: settings, error: settingsError } = await supabase
                .from('system_settings')
                .select('value')
                .eq('category', 'push_notifications')
                .eq('key', 'vapid_keys')
                .single();

            if (settingsError) throw settingsError;

            const publicKey = settings?.value?.publicKey;
            if (!publicKey) {
                throw new Error('VAPID public key not configured');
            }

            // Register service worker if not already registered
            let registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                registration = await navigator.serviceWorker.register('/sw.js');
                await navigator.serviceWorker.ready;
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Save subscription to database
            const subscriptionJSON = subscription.toJSON();
            const { error: dbError } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscriptionJSON.keys?.p256dh || '',
                    auth: subscriptionJSON.keys?.auth || '',
                    user_agent: navigator.userAgent
                }, {
                    onConflict: 'user_id,endpoint'
                });

            if (dbError) throw dbError;

            setState(prev => ({
                ...prev,
                isSubscribed: true,
                subscription
            }));

            return true;
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            alert('Error al suscribirse a notificaciones: ' + (error as Error).message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Unsubscribe from push notifications
    const unsubscribe = async (): Promise<boolean> => {
        if (!state.subscription || !user) return false;

        try {
            setLoading(true);

            // Unsubscribe from push manager
            await state.subscription.unsubscribe();

            // Remove from database
            const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id)
                .eq('endpoint', state.subscription.endpoint);

            if (error) throw error;

            setState(prev => ({
                ...prev,
                isSubscribed: false,
                subscription: null
            }));

            return true;
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Test notification
    const sendTestNotification = async (): Promise<boolean> => {
        if (!user) return false;

        try {
            // Explicitly pass the JWT so the Edge Function can verify the user
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Sesión expirada. Volvé a iniciar sesión.');
                return false;
            }

            const { error } = await supabase.functions.invoke('send-push', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: {
                    userId: user.id,
                    title: '🎉 Test de Notificación',
                    body: 'Las notificaciones están funcionando correctamente',
                    url: '/'
                }
            });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error sending test notification:', error);
            alert('Error al enviar notificación de prueba');
            return false;
        }
    };


    return {
        ...state,
        loading,
        requestPermission,
        subscribe,
        unsubscribe,
        sendTestNotification
    };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
