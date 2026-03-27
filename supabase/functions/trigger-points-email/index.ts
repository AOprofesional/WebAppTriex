import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Authenticate webhook request using Service Role Key
        const authHeader = req.headers.get('Authorization')
        if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const payload = await req.json()

        // Verify this is a valid webhook payload
        if (payload.type !== 'INSERT' || payload.table !== 'orange_points_ledger') {
            return new Response(JSON.stringify({ message: 'Ignored: not an INSERT to orange_points_ledger' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const record = payload.record
        const passengerId = record?.passenger_id
        const points = record?.points || 0
        const reason = record?.reason || 'DEFAULT'

        // Only send email for positive points (new accruals)
        if (!passengerId || points <= 0) {
            return new Response(JSON.stringify({ message: 'No points to notify' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, serviceKey)

        // 1. Fetch passenger email and name
        const { data: passenger, error: passengerError } = await supabase
            .from('passengers')
            .select('first_name, email, orange_member_number, profile_id')
            .eq('id', passengerId)
            .single()

        if (passengerError || !passenger || !passenger.email) {
            console.error('Cannot find passenger or email:', passengerError)
            return new Response(JSON.stringify({ message: 'Passenger not found or no email' }), {
                status: 200, // Returning 200 so webhook doesn't retry infinitely
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Fallback: if main email is missing, check profiles
        let userEmail = passenger.email
        if (!userEmail && passenger.profile_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', passenger.profile_id)
                .single()
            if (profile?.email) {
                userEmail = profile.email
            }
        }

        if (!userEmail) {
            return new Response(JSON.stringify({ message: 'No email found for passenger' }), { status: 200 })
        }

        // 3. Calculate new total balance for the passenger
        const { data: pointRows, error: pointsError } = await supabase
            .from('orange_points_ledger')
            .select('points')
            .eq('passenger_id', passengerId)
            .eq('status', 'ACTIVE');

        const newBalance = (pointRows || []).reduce((acc: number, row: any) => acc + (row.points || 0), 0);

        // 4. Build Email HTML
        const reasonLabels: Record<string, string> = {
            TRIP_PURCHASE: 'Compra de viaje',
            REFERRAL_PURCHASE: 'Referido que compró',
            MANUAL_ADJUSTMENT: 'Ajuste manual',
            BONUS: 'Bonificación',
            REDEMPTION: 'Canje de puntos',
        };
        const readableReason = reasonLabels[reason] || reason;

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Puntos - Orange Pass</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;font-weight:600;">Orange Pass</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:800;">Triex Viajes</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 8px;color:#71717a;font-size:14px;">Hola,</p>
              <h2 style="margin:0 0 24px;color:#18181b;font-size:22px;font-weight:700;">
                ${passenger.first_name}
              </h2>
              <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#9a3412;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                  Puntos acreditados
                </p>
                <p style="margin:0;font-size:48px;font-weight:900;color:#ea580c;line-height:1.1;">
                  +${points}
                </p>
                <p style="margin:8px 0 0;color:#c2410c;font-size:14px;">
                  Motivo: <strong>${readableReason}</strong>
                </p>
              </div>
              <div style="background:#fafafa;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;margin-bottom:24px;">
                <table width="100%">
                  <tr>
                    <td style="color:#71717a;font-size:13px;">Tu saldo actual</td>
                    <td align="right" style="color:#18181b;font-size:18px;font-weight:700;">${newBalance} pts</td>
                  </tr>
                  ${passenger.orange_member_number ? \`
                  <tr>
                    <td style="color:#71717a;font-size:13px;padding-top:8px;">Número de socio</td>
                    <td align="right" style="color:#71717a;font-size:13px;padding-top:8px;font-family:monospace;">\${passenger.orange_member_number}</td>
                  </tr>\` : ''}
                </table>
              </div>
              <p style="color:#71717a;font-size:13px;line-height:1.6;margin:0;">
                Podés consultar el detalle de tus puntos ingresando a la aplicación Triex en la sección <strong>Orange Pass</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid #f4f4f5;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;line-height:1.6;">
                Este es un email automático de Triex Viajes. No responder a este correo.<br>
                © 2025 Triex Viajes — Orange Pass Program
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim();

        // 5. Trigger send-email edge function
        const sendEmailResponse = await fetch(\`\${supabaseUrl}/functions/v1/send-email\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${serviceKey}\`
            },
            body: JSON.stringify({
                to: userEmail,
                subject: 'Has ganado puntos Orange Pass',
                html: html
            })
        });

        const sendEmailResult = await sendEmailResponse.json();

        return new Response(JSON.stringify({ success: true, emailSent: sendEmailResult }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Error in trigger-points-email:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
