import { supabase } from '../lib/supabase';

// Genera el HTML del email de notificación de puntos
export function buildPointsEmailHtml(params: {
    firstName: string;
    points: number;
    reason: string;
    newBalance: number;
    memberNumber?: string | null;
}): string {
    const reasonLabels: Record<string, string> = {
        TRIP_PURCHASE: 'Compra de viaje',
        REFERRAL_PURCHASE: 'Referido que compró',
        MANUAL_ADJUSTMENT: 'Ajuste manual',
        BONUS: 'Bonificación',
        REDEMPTION: 'Canje de puntos',
    };
    const readableReason = reasonLabels[params.reason] || params.reason;

    return `
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
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;font-weight:600;">Orange Pass</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:800;">Triex Viajes</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 8px;color:#71717a;font-size:14px;">Hola,</p>
              <h2 style="margin:0 0 24px;color:#18181b;font-size:22px;font-weight:700;">
                ${params.firstName}
              </h2>

              <!-- Points highlight -->
              <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#9a3412;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                  Puntos ${params.points >= 0 ? 'acreditados' : 'debitados'}
                </p>
                <p style="margin:0;font-size:48px;font-weight:900;color:#ea580c;line-height:1.1;">
                  ${params.points >= 0 ? '+' : ''}${params.points}
                </p>
                <p style="margin:8px 0 0;color:#c2410c;font-size:14px;">
                  Motivo: <strong>${readableReason}</strong>
                </p>
              </div>

              <!-- Balance -->
              <div style="background:#fafafa;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;margin-bottom:24px;">
                <table width="100%">
                  <tr>
                    <td style="color:#71717a;font-size:13px;">Tu saldo actual</td>
                    <td align="right" style="color:#18181b;font-size:18px;font-weight:700;">${params.newBalance} pts</td>
                  </tr>
                  ${params.memberNumber ? `
                  <tr>
                    <td style="color:#71717a;font-size:13px;padding-top:8px;">Número de socio</td>
                    <td align="right" style="color:#71717a;font-size:13px;padding-top:8px;font-family:monospace;">${params.memberNumber}</td>
                  </tr>` : ''}
                </table>
              </div>

              <p style="color:#71717a;font-size:13px;line-height:1.6;margin:0;">
                Podés consultar el detalle de tus puntos ingresando a la aplicación Triex en la sección <strong>Orange Pass</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
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
}

// Genera HTML para email de notificación general (info, advertencia, etc.)
export function buildGenericEmailHtml(params: {
    firstName: string;
    title: string;
    message: string;
    type?: string;
}): string {
    const typeColors: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
        success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
        warning: { bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
        error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
        trip_update: { bg: '#faf5ff', border: '#e9d5ff', text: '#7c3aed' },
        trip_reminder: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
    };
    const colors = typeColors[params.type || 'info'] || typeColors.info;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Triex Viajes</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#71717a;font-size:14px;">Hola, <strong style="color:#18181b;">${params.firstName}</strong></p>
              <div style="background:${colors.bg};border:1.5px solid ${colors.border};border-radius:10px;padding:20px 24px;margin-bottom:24px;">
                <h2 style="margin:0 0 8px;color:${colors.text};font-size:18px;font-weight:700;">${params.title}</h2>
                <p style="margin:0;color:#3f3f46;font-size:14px;line-height:1.7;">${params.message}</p>
              </div>
              <p style="color:#71717a;font-size:13px;line-height:1.6;margin:0;">
                Ingresá a la app Triex para más información.
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
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
}

// Hook para enviar emails vía Edge Function send-email
export const useEmailService = () => {
    const sendEmail = async (params: {
        to: string | string[];
        subject: string;
        html: string;
        text?: string;
    }): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: params,
            });

            if (error) {
                console.error('Error enviando email:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (err: any) {
            console.error('Error en useEmailService.sendEmail:', err);
            return { success: false, error: err.message };
        }
    };

    return { sendEmail };
};
