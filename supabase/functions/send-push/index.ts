import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ICON_URL = 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/archivos-sistema/favicon-192.png'

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

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const payload: PushPayload = await req.json()

        // Get VAPID keys
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('category', 'push_notifications')
            .eq('key', 'vapid_keys')
            .single()

        if (settingsError) throw settingsError
        const vapidKeys = settings.value
        if (!vapidKeys?.publicKey || !vapidKeys?.privateKey) throw new Error('VAPID keys not configured')

        webpush.setVapidDetails(
            'mailto:no_reply@triexviajes.com.ar',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        )

        // Get subscriptions
        const targetUserIds = payload.userIds || (payload.userId ? [payload.userId] : [user.id])
        const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
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

        console.log(`Sending push to ${subscriptions.length} subscriptions`)

        const notificationData = {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || ICON_URL,
            badge: ICON_URL,
            data: { url: payload.url || '/' },
            tag: payload.tag,
            requireInteraction: payload.requireInteraction || false,
        }

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    }

                    await webpush.sendNotification(
                        pushSubscription,
                        JSON.stringify(notificationData)
                    )

                    return { success: true, endpoint: sub.endpoint }
                } catch (error: any) {
                    console.error('Push failed:', error.message || error.body)
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
                        console.log('Removed expired subscription')
                    }
                    return { success: false, endpoint: sub.endpoint, error: error.message }
                }
            })
        )

        const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length
        const failed = results.length - successful

        return new Response(
            JSON.stringify({ message: 'Push notifications processed', total: results.length, successful, failed }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Error in send-push:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
