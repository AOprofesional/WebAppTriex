import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface CreatePassengerData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    passenger_type_id: number;
    birth_date?: string | null;
    cuil?: string | null;
    document_type?: 'DNI' | 'Pasaporte' | 'Otro' | null;
    document_number?: string | null;
    profile_id?: string | null;
    referred_by_passenger_id?: string | null;
    referred_by_code_raw?: string | null;
    referral_linked_at?: string | null;
    assigned_to?: string | null;
    savia_file_number?: string | null;
}

export interface CreatePassengerResult {
    success: boolean;
    passenger: any | null;
    inviteSent: boolean;
    message: string;
    errorDetails?: {
        message: string;
        details?: string | null;
        hint?: string | null;
        code?: string | null;
        payload?: any;
    };
}

export const useCreatePassengerWithInvite = () => {
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createAndInvite = async (
        mainData: CreatePassengerData, 
        companionsData: Omit<CreatePassengerData, 'email'>[] = []
    ): Promise<CreatePassengerResult> => {
        setCreating(true);
        setError(null);

        try {
            // 1. Obtener datos de auth y rol
            const { data: authData } = await supabase.auth.getUser();
            const { data: roleData } = await supabase.rpc('get_my_role');

            const baseInsertData: any = {
                created_by: authData.user?.id
            };

            // Auto-asignar a sí mismo si es operador (y no viene forzado otro assigned_to)
            if (roleData === 'operator' && authData.user && !mainData.assigned_to) {
                baseInsertData.assigned_to = authData.user.id;
            }

            // 2. Crear pasajero principal
            console.log('[useCreatePassengerWithInvite] Insertando pasajero principal:', { ...mainData, ...baseInsertData });
            const { data: mainPassenger, error: createError } = await supabase
                .from('passengers')
                .insert([{ ...mainData, ...baseInsertData }])
                .select()
                .single();

            if (createError) {
                console.error('[useCreatePassengerWithInvite] Error al crear pasajero principal:', {
                    error: createError,
                    code: createError.code,
                    details: createError.details,
                    hint: createError.hint,
                    payload: { ...mainData, ...baseInsertData }
                });
                const detailStr = [
                    createError.message,
                    createError.details ? `Detalle: ${createError.details}` : null,
                    createError.hint ? `Pista: ${createError.hint}` : null,
                    createError.code ? `(Código: ${createError.code})` : null
                ].filter(Boolean).join(' | ');

                return {
                    success: false,
                    passenger: null,
                    inviteSent: false,
                    message: `Error al crear pasajero principal: ${detailStr}`,
                    errorDetails: {
                        message: createError.message,
                        details: createError.details,
                        hint: createError.hint,
                        code: createError.code,
                        payload: { ...mainData, ...baseInsertData }
                    }
                };
            }

            // 3. Crear acompañantes si existen
            if (companionsData.length > 0) {
                const companionsToInsert = companionsData.map(comp => {
                    const docNum = comp.document_number?.trim() || null;
                    const docType = docNum ? (comp.document_type || 'DNI') : null;
                    return {
                        ...comp,
                        document_type: docType,
                        document_number: docNum,
                        email: mainData.email, // Comparten el mismo email
                        parent_passenger_id: mainPassenger.id, // Vinculados al principal
                        ...baseInsertData
                    };
                });

                console.log('[useCreatePassengerWithInvite] Insertando acompañantes:', companionsToInsert);

                const { error: companionsError } = await supabase
                    .from('passengers')
                    .insert(companionsToInsert);
                
                if (companionsError) {
                    console.error('[useCreatePassengerWithInvite] Error al crear acompañantes:', {
                        error: companionsError,
                        message: companionsError.message,
                        details: companionsError.details,
                        hint: companionsError.hint,
                        code: companionsError.code,
                        payloadSent: companionsToInsert,
                        mainPassengerId: mainPassenger.id
                    });

                    // Rollback main passenger to prevent inconsistent state
                    const { error: rollbackError } = await supabase.from('passengers').delete().eq('id', mainPassenger.id);
                    if (rollbackError) {
                        console.warn('[useCreatePassengerWithInvite] Rollback del titular falló:', rollbackError);
                    } else {
                        console.log('[useCreatePassengerWithInvite] Rollback del titular exitoso para mantener integridad.');
                    }

                    const detailStr = [
                        companionsError.message,
                        companionsError.details ? `Detalle: ${companionsError.details}` : null,
                        companionsError.hint ? `Pista: ${companionsError.hint}` : null,
                        companionsError.code ? `(Código: ${companionsError.code})` : null
                    ].filter(Boolean).join(' | ');

                    const fullMsg = `Error al crear acompañante: ${detailStr}`;
                    setError(fullMsg);

                    return {
                        success: false,
                        passenger: null,
                        inviteSent: false,
                        message: fullMsg,
                        errorDetails: {
                            message: companionsError.message,
                            details: companionsError.details,
                            hint: companionsError.hint,
                            code: companionsError.code,
                            payload: companionsToInsert
                        }
                    };
                }
            }

            // 4. Enviar magic link de invitación
            const { error: inviteError } = await supabase.auth.signInWithOtp({
                email: mainData.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        passenger_id: mainPassenger.id,
                        invited_by: 'admin'
                    }
                }
            });

            if (inviteError) {
                // Pasajeros creados pero error al enviar invitación
                console.error('[useCreatePassengerWithInvite] Error sending invite:', inviteError);
                return {
                    success: true,
                    passenger: mainPassenger,
                    inviteSent: false,
                    message: `Pasajeros creados, pero no se pudo enviar la invitación por correo: ${inviteError.message}`
                };
            }

            return {
                success: true,
                passenger: mainPassenger,
                inviteSent: true,
                message: companionsData.length > 0 
                    ? `Titular y ${companionsData.length} acompañante(s) creados exitosamente. Invitación enviada a ${mainData.email}`
                    : `Pasajero creado e invitación enviada a ${mainData.email}`
            };

        } catch (err: any) {
            console.error('[useCreatePassengerWithInvite] Error inesperado:', err);
            const errorMessage = err.message || 'Error desconocido';
            setError(errorMessage);
            return {
                success: false,
                passenger: null,
                inviteSent: false,
                message: errorMessage,
                errorDetails: {
                    message: errorMessage
                }
            };
        } finally {
            setCreating(false);
        }
    };

    return { createAndInvite, creating, error };
};
