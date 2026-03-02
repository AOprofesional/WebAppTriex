import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SignJWT } from 'https://deno.land/x/jose@v4.14.4/index.ts'

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

interface PushSubscription {
    endpoint: string
    p256dh: string
    auth: string
}

// Convert base64url string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

// Convert Uint8Array to base64url string (for JWK)
function uint8ArrayToBase64Url(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

// Import VAPID private key from base64url raw format to CryptoKey
async function importVapidPrivateKey(publicKeyB64: string, privateKeyB64: string): Promise<CryptoKey> {
    // VAPID public key is an uncompressed EC point: 0x04 | x (32 bytes) | y (32 bytes) = 65 bytes total
    const publicKeyBytes = urlBase64ToUint8Array(publicKeyB64)
    const privateKeyBytes = urlBase64ToUint8Array(privateKeyB64)

    if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
        throw new Error(`Invalid VAPID public key length: ${publicKeyBytes.length}, expected 65 bytes starting with 0x04`)
    }

    const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33))
    const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65))
    const d = uint8ArrayToBase64Url(privateKeyBytes)

    return await crypto.subtle.importKey(
        'jwk',
        { kty: 'EC', crv: 'P-256', x, y, d, ext: true },
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    )
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

        // Import private key properly (fix for ECDSA P-256)
        const privateKey = await importVapidPrivateKey(vapidKeys.publicKey, vapidKeys.privateKey)

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
            subscriptions.map(async (sub: PushSubscription) => {
                try {
                    const url = new URL(sub.endpoint)
                    const audience = `${url.protocol}//${url.host}`

                    const jwt = await new SignJWT({
                        aud: audience,
                        sub: 'mailto:no_reply@triexviajes.com.ar'
                    })
                        .setProtectedHeader({ typ: 'JWT', alg: 'ES256' })
                        .setIssuedAt()
                        .setExpirationTime('12h')
                        .sign(privateKey)

                    const vapidAuthHeader = `vapid t=${jwt}, k=${vapidKeys.publicKey}`

                    const response = await fetch(sub.endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': vapidAuthHeader,
                            'Content-Type': 'application/json',
                            'TTL': '86400',
                        },
                        body: JSON.stringify(notificationData)
                    })

                    const responseText = await response.text()
                    console.log(`Push HTTP ${response.status}: ${responseText}`)

                    if (!response.ok) {
                        if (response.status === 410 || response.status === 404) {
                            await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
                            console.log('Removed expired subscription')
                        }
                        throw new Error(`Push service: ${response.status} - ${responseText}`)
                    }

                    return { success: true, endpoint: sub.endpoint }
                } catch (error: any) {
                    console.error('Push failed:', error.message)
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
