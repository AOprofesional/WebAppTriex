import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface CreatePassengerData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    passenger_type_id: number;
    birth_date?: string;
    cuil?: string;
    document_type?: 'DNI' | 'Pasaporte' | 'Otro';
    document_number?: string;
}

export const useCreatePassengerWithInvite = () => {
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createAndInvite = async (data: CreatePassengerData) => {
        setCreating(true);
        setError(null);

        try {
            // 1. Crear pasajero (profile_id queda NULL automáticamente)
            const { data: passenger, error: createError } = await supabase
                .from('passengers')
                .insert([{
                    ...data,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                }])
                .select()
                .single();

            if (createError) {
                throw new Error(`Error al crear pasajero: ${createError.message}`);
            }

            // 2. Enviar magic link de invitación
            const { error: inviteError } = await supabase.auth.signInWithOtp({
                email: data.email,
                options: {
                    emailRedirectTo: 'https://www.triex.app/#/admin/passengers',
                    data: {
                        passenger_id: passenger.id,
                        invited_by: 'admin'
                    }
                }
            });

            if (inviteError) {
                // Pasajero creado pero error al enviar invitación
                console.error('Error sending invite:', inviteError);
                return {
                    success: true,
                    passenger,
                    inviteSent: false,
                    message: `Pasajero creado, pero no se pudo enviar la invitación: ${inviteError.message}`
                };
            }

            return {
                success: true,
                passenger,
                inviteSent: true,
                message: `Pasajero creado e invitación enviada a ${data.email}`
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
