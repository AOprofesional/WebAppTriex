import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
    userId?: string
    userIds?: string[]
    title: string
    body: string
    icon?: string
    url?: string
    tag?: string
    requireInteraction?: boolean
}

interface PushSubscription {
    endpoint: string
    p256dh: string
    auth: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Verify user is authenticated
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const payload: PushPayload = await req.json()

        // Get VAPID keys from system settings
        const { data: settings, error: settingsError } = await supabaseClient
            .from('system_settings')
            .select('value')
            .eq('category', 'push_notifications')
            .eq('key', 'vapid_keys')
            .single()

        if (settingsError) throw settingsError

        const vapidKeys = settings.value
        if (!vapidKeys?.publicKey || !vapidKeys?.privateKey) {
            throw new Error('VAPID keys not configured')
        }

        // Get target user IDs
        const targetUserIds = payload.userIds || (payload.userId ? [payload.userId] : [user.id])

        // Get push subscriptions for target users
        const { data: subscriptions, error: subscriptionsError } = await supabaseClient
            .from('push_subscriptions')
            .select('*')
            .in('user_id', targetUserIds)

        if (subscriptionsError) throw subscriptionsError

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No subscriptions found' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Prepare notification data
        const notificationData = {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            data: {
                url: payload.url || '/',
            },
            tag: payload.tag,
            requireInteraction: payload.requireInteraction || false,
        }

        // Send push notifications using web-push
        const webpush = (await import('https://esm.sh/web-push@3.6.6')).default

        webpush.setVapidDetails(
            'mailto:admin@triex.com',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        )

        const results = await Promise.allSettled(
            subscriptions.map(async (sub: PushSubscription) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        JSON.stringify(notificationData)
                    )
                    return { success: true, endpoint: sub.endpoint }
                } catch (error: any) {
                    console.error('Failed to send notification:', error)

                    // If subscription is no longer valid, remove it
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await supabaseClient
                            .from('push_subscriptions')
                            .delete()
                            .eq('endpoint', sub.endpoint)
                    }

                    return { success: false, endpoint: sub.endpoint, error: error.message }
                }
            })
        )

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
        const failed = results.length - successful

        return new Response(
            JSON.stringify({
                message: 'Push notifications sent',
                total: results.length,
                successful,
                failed,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Error sending push notification:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
