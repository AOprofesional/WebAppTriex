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
        // Authenticate request using Service Role Key (since this will be triggered by pg_cron or admin)
        const authHeader = req.headers.get('Authorization')
        if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, serviceKey)

        // 1. Find trips that ended before now and haven't had surveys sent yet
        const now = new Date().toISOString()
        const { data: trips, error: tripsError } = await supabase
            .from('trips')
            .select('id, name, destination')
            .lte('end_date', now)
            .or('survey_sent.is.null,survey_sent.eq.false')

        if (tripsError || !trips || trips.length === 0) {
            return new Response(JSON.stringify({ message: 'No pending survey emails to send', count: 0 }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        let sentCount = 0;

        for (const trip of trips) {
            // 2. Fetch all passengers for this trip
            const { data: tripPassengers } = await supabase
                .from('trip_passengers')
                .select('passenger_id')
                .eq('trip_id', trip.id)

            if (!tripPassengers || tripPassengers.length === 0) {
                // Mark as sent to ignore it next time
                await supabase.from('trips').update({ survey_sent: true }).eq('id', trip.id)
                continue;
            }

            const passengerIds = tripPassengers.map(tp => tp.passenger_id)

            // 3. Get passenger details (emails)
            const { data: passengers } = await supabase
                .from('passengers')
                .select('id, first_name, email, profile_id')
                .in('id', passengerIds)

            if (!passengers) continue;

            const emailPromises = passengers.map(async (passenger) => {
                let userEmail = passenger.email
                // Fallback to profile email
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

                if (!userEmail) return false;

                // Build HTML email
                const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
    body{margin:0;padding:24px;background:#f4f4f5;font-family:'Outfit',sans-serif;}
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
    <tr>
      <td style="padding:40px 40px 32px;text-align:center;">
        <h1 style="margin:0 0 16px;color:#18181b;font-size:24px;font-weight:700;letter-spacing:-0.5px;">¡Gracias por viajar con nosotros! ✈️</h1>
        <p style="margin:0 0 16px;color:#71717a;font-size:16px;">¡Hola, <strong style="color:#18181b;">${passenger.first_name}</strong>! Esperamos que hayas disfrutado tu viaje a <strong>${trip.destination || trip.name}</strong>.</p>
        
        <div style="background:#fff7ed;border:1.5px solid #fdba74;border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center;">
          <h2 style="margin:0 0 8px;color:#f97316;font-size:18px;font-weight:700;">¡Tu opinión nos importa mucho!</h2>
          <p style="margin:0 0 12px;color:#3f3f46;font-size:14px;line-height:1.7;">
            Contanos cómo fue tu experiencia respondiendo una breve encuesta en la aplicación. 
          </p>
          <div style="display:inline-block;background:#f97316;color:#ffffff;padding:8px 16px;border-radius:8px;font-weight:600;font-size:14px;">
            🎁 Ganá +5 Puntos Orange
          </div>
        </div>

        <p style="color:#71717a;font-size:15px;line-height:1.6;margin:0;">
          Ingresá a la aplicación móvil de Triex Viajes para completar la encuesta y obtener tus beneficios.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 28px;border-top:1px solid #f4f4f5;">
        <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
          Email automático de Triex Viajes · No responder<br>
          © 2025 Triex Viajes
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
                `.trim();

                // Send Email via generic edge function
                try {
                    const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${serviceKey}`
                        },
                        body: JSON.stringify({
                            to: userEmail,
                            subject: '¡Evaluá tu viaje y ganá puntos!',
                            html: html
                        })
                    });
                    
                    if (sendEmailResponse.ok) {
                        sentCount++;
                        return true;
                    }
                } catch (e) {
                    console.error('Failed to send survey email to', userEmail, e)
                }
                return false;
            })

            await Promise.all(emailPromises);

            // Mark trip as survey_sent once processed
            await supabase.from('trips').update({ survey_sent: true }).eq('id', trip.id)
        }

        return new Response(JSON.stringify({ success: true, message: `Processed ${trips.length} trips and sent ${sentCount} emails.` }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Error in trigger-survey-emails:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
