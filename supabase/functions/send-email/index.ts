import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
    to: string | string[]
    subject: string
    html: string
    text?: string
}

async function sendSmtpEmail(
    smtpConfig: any,
    smtpPassword: string,
    payload: EmailPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        const { SmtpClient } = await import('https://deno.land/x/[email protected]/mod.ts')

        const client = new SmtpClient()

        const connectConfig = {
            hostname: smtpConfig.host,
            port: smtpConfig.port,
            username: smtpConfig.user,
            password: smtpPassword,
        }

        // TLS para puerto 465, STARTTLS para 587
        if (smtpConfig.port === 465 || smtpConfig.secure === true) {
            await client.connectTLS(connectConfig)
        } else {
            await client.connect(connectConfig)
        }

        const toArray = Array.isArray(payload.to) ? payload.to : [payload.to]

        for (const recipient of toArray) {
            await client.send({
                from: `${smtpConfig.from_name} <${smtpConfig.from_email}>`,
                to: recipient,
                subject: payload.subject,
                content: payload.text || 'Abrir email en un cliente compatible con HTML',
                html: payload.html,
            })
        }

        await client.close()
        return { success: true }
    } catch (err: any) {
        console.error('SMTP send error:', err)
        return { success: false, error: err.message }
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verificar autenticación del usuario
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Cliente administrador para leer configuración SMTP
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Leer config SMTP desde system_settings
        const { data: settingsRow, error: settingsError } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('category', 'email_config')
            .eq('key', 'smtp_settings')
            .single()

        if (settingsError || !settingsRow) {
            throw new Error('Configuración SMTP no encontrada en system_settings')
        }

        const smtpConfig = settingsRow.value

        // Contraseña desde secreto de entorno (más seguro que DB)
        const smtpPassword = Deno.env.get('SMTP_PASSWORD') ?? ''
        if (!smtpPassword) {
            throw new Error('Secreto SMTP_PASSWORD no configurado en la Edge Function')
        }

        const payload: EmailPayload = await req.json()

        if (!payload.to || !payload.subject || !payload.html) {
            return new Response(
                JSON.stringify({ error: 'Faltan campos requeridos: to, subject, html' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('Enviando email a:', payload.to, '| Asunto:', payload.subject)

        const result = await sendSmtpEmail(smtpConfig, smtpPassword, payload)

        if (!result.success) {
            return new Response(
                JSON.stringify({ error: result.error }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Email enviado correctamente' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Error en send-email:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Error desconocido' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
