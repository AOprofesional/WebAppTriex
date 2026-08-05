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

export const useCreatePassengerWithInvite = () => {
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createAndInvite = async (mainData: CreatePassengerData, companionsData: Omit<CreatePassengerData, 'email'>[] = []) => {
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
            const { data: mainPassenger, error: createError } = await supabase
                .from('passengers')
                .insert([{ ...mainData, ...baseInsertData }])
                .select()
                .single();

            if (createError) {
                throw new Error(`Error al crear pasajero principal: ${createError.message}`);
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

                const { error: companionsError } = await supabase
                    .from('passengers')
                    .insert(companionsToInsert);
                
                if (companionsError) {
                    // Rollback main passenger to prevent inconsistent state
                    await supabase.from('passengers').delete().eq('id', mainPassenger.id);
                    throw new Error(`Error al crear acompañantes: ${companionsError.message}`);
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
                console.error('Error sending invite:', inviteError);
                return {
                    success: true,
                    passenger: mainPassenger,
                    inviteSent: false,
                    message: `Pasajeros creados, pero no se pudo enviar la invitación: ${inviteError.message}`
                };
            }

            return {
                success: true,
                passenger: mainPassenger,
                inviteSent: true,
                message: `Pasajero(s) creado(s) e invitación enviada a ${mainData.email}`
            };

        } catch (err: any) {
            const errorMessage = err.message || 'Error desconocido';
            setError(errorMessage);
            return {
                success: false,
                passenger: null,
                inviteSent: false,
                message: errorMessage
            };
        } finally {
            setCreating(false);
        }
    };

    return { createAndInvite, creating, error };
};
