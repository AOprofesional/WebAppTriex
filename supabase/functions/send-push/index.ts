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
        // Client with user JWT — used only to verify the requesting user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Service-role client — bypasses RLS to read VAPID keys and subscriptions
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify user is authenticated
        const authHeader = req.headers.get('Authorization')
        console.log('Auth header presence:', !!authHeader)

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser()

        console.log('getUser result:', user?.id, 'error:', userError?.message)

        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const payload: PushPayload = await req.json()

        // Get VAPID keys from system settings
        const { data: settings, error: settingsError } = await supabaseAdmin
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

        // Send push notifications using manual fetch and jose for JWT
        const { SignJWT } = await import('https://deno.land/x/jose@v4.14.4/index.ts')

        const results = await Promise.allSettled(
            subscriptions.map(async (sub: PushSubscription) => {
                try {
                    // Create VAPID JWT
                    const url = new URL(sub.endpoint)
                    const audience = `${url.protocol}//${url.host}`

                    // Import private key
                    const privateKeyArray = urlBase64ToUint8Array(vapidKeys.privateKey)
                    const cryptoKey = await crypto.subtle.importKey(
                        'jwk',
                        {
                            kty: 'EC',
                            crv: 'P-256',
                            x: vapidKeys.publicKey.slice(0, 43), // simplified, typically we need proper JWK parsing
                            y: vapidKeys.publicKey.slice(43),
                            d: vapidKeys.privateKey,
                            ext: true
                        },
                        { name: 'ECDSA', namedCurve: 'P-256' },
                        true,
                        ['sign']
                    )

                    const jwt = await new SignJWT({
                        aud: audience,
                        sub: 'mailto:admin@triex.com'
                    })
                        .setProtectedHeader({ typ: 'JWT', alg: 'ES256' })
                        .setExpirationTime('12h')
                        .sign(cryptoKey)

                    const authHeader = `vapid t=${jwt}, k=${vapidKeys.publicKey}`

                    // Send to push service
                    const response = await fetch(sub.endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/json',
                            'TTL': '86400' // 1 day
                        },
                        body: JSON.stringify(notificationData)
                    })

                    if (!response.ok) {
                        if (response.status === 410 || response.status === 404) {
                            await supabaseAdmin
                                .from('push_subscriptions')
                                .delete()
                                .eq('endpoint', sub.endpoint)
                        }
                        throw new Error(`Push service returned ${response.status}: ${await response.text()}`)
                    }

                    return { success: true, endpoint: sub.endpoint }
                } catch (error: any) {
                    console.error('Failed to send notification to', sub.endpoint, error)
                    return { success: false, endpoint: sub.endpoint, error: error.message }
                }
            })
        )

        const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length
        const failed = results.length - successful

        return new Response(
            JSON.stringify({
                message: 'Push notifications processed',
                total: results.length,
                successful,
                failed,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Error sending push notification:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error occurred' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// Helper functions for base64url
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
