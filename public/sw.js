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
    console.log('[Service Worker] Push received', event);

    let notificationData = {
        title: 'Triex',
        body: 'Tienes una nueva notificación',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
            url: '/'
        }
    };

    // Parse notification payload
    if (event.data) {
        try {
            const payload = event.data.json();
            notificationData = {
                title: payload.title || notificationData.title,
                body: payload.body || notificationData.body,
                icon: payload.icon || notificationData.icon,
                badge: payload.badge || notificationData.badge,
                data: payload.data || notificationData.data,
                tag: payload.tag,
                requireInteraction: payload.requireInteraction || false
            };
        } catch (err) {
            console.error('[Service Worker] Error parsing notification payload', err);
        }
    }

    // Show notification
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            data: notificationData.data,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction
        })
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

    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: event.oldSubscription.options.applicationServerKey
        })
            .then((subscription) => {
                console.log('[Service Worker] Resubscribed successfully', subscription);
                // You might want to send this to your server
                return fetch('/api/update-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });
            })
    );
});
