/**
 * config.ts
 * Punto centralizado para todas las variables de entorno del frontend.
 * Todas las variables deben estar definidas en .env.local (no commitear).
 * Ver .env.example para la plantilla.
 */

// ── Supabase ──────────────────────────────────────────────────────────────────
export const SUPABASE_URL: string =
    import.meta.env.VITE_SUPABASE_URL ?? '';

export const SUPABASE_ANON_KEY: string =
    import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * URL base del Storage público de Supabase.
 * Derivada automáticamente de SUPABASE_URL.
 * Ejemplo: https://xxx.supabase.co/storage/v1/object/public
 */
export const SUPABASE_STORAGE_URL: string =
    SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public` : '';

// ── Contacto WhatsApp ─────────────────────────────────────────────────────────
/** Número de soporte principal para pasajeros (formato internacional sin +) */
export const SUPPORT_WHATSAPP: string =
    import.meta.env.VITE_SUPPORT_WHATSAPP ?? '';

/** Número de soporte técnico para administradores */
export const ADMIN_WHATSAPP: string =
    import.meta.env.VITE_ADMIN_WHATSAPP ?? '';

// ── Contacto Email ────────────────────────────────────────────────────────────
/** Email de soporte para pasajeros */
export const SUPPORT_EMAIL: string =
    import.meta.env.VITE_SUPPORT_EMAIL ?? '';

/** Email de soporte técnico para administradores */
export const ADMIN_SUPPORT_EMAIL: string =
    import.meta.env.VITE_ADMIN_SUPPORT_EMAIL ?? '';

// ── Validación en desarrollo ──────────────────────────────────────────────────
if (import.meta.env.DEV) {
    const missing: string[] = [];
    if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
    if (!SUPPORT_WHATSAPP) missing.push('VITE_SUPPORT_WHATSAPP');
    if (!ADMIN_WHATSAPP) missing.push('VITE_ADMIN_WHATSAPP');
    if (!SUPPORT_EMAIL) missing.push('VITE_SUPPORT_EMAIL');
    if (!ADMIN_SUPPORT_EMAIL) missing.push('VITE_ADMIN_SUPPORT_EMAIL');

    if (missing.length > 0) {
        console.warn(
            `[config] ⚠️ Variables de entorno faltantes en .env.local:\n  ${missing.join('\n  ')}\nCopiá .env.example → .env.local y completá los valores.`
        );
    }
}
