// Service Worker for Push Notifications
// This handles push events and notification clicks

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(self.clients.claim());
});

// Handle push events
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');

    let title = 'Triex';
    let options = {
        body: 'Tienes una nueva notificación',
        icon: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/archivos-sistema/favicon-192.png',
        badge: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/archivos-sistema/favicon-192.png',
        data: {
            url: '/#/'
        }
    };

    // Parse notification payload
    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('[Service Worker] Push payload:', payload);

            if (payload.title) title = payload.title;

            options = {
                ...options,
                body: payload.body || options.body,
                icon: payload.icon || options.icon,
                badge: payload.badge || options.badge,
                data: payload.data || options.data,
                tag: payload.tag,
                requireInteraction: payload.requireInteraction || false
            };
        } catch (err) {
            console.error('[Service Worker] Error parsing notification payload', err);
        }
    }

    // Show notification
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    // Open or focus the app
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus().then(() => {
                            // Navigate to the target URL
                            if ('navigate' in client) {
                                return client.navigate(urlToOpen);
                            }
                        });
                    }
                }
                // If no window is open, open a new one
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[Service Worker] Push subscription changed', event);

    // Re-subscribe with the same VAPID key
    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: event.oldSubscription?.options?.applicationServerKey
        })
            .then((subscription) => {
                console.log('[Service Worker] Resubscribed successfully', subscription);
                // Notify all open windows so the app can update the subscription in the DB
                return self.clients.matchAll({ type: 'window' }).then((clients) => {
                    clients.forEach((client) => {
                        client.postMessage({
                            type: 'PUSH_SUBSCRIPTION_CHANGED',
                            subscription: subscription.toJSON()
                        });
                    });
                });
            })
            .catch((err) => {
                console.error('[Service Worker] Failed to resubscribe', err);
            })
    );
});
