import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';
import toast from 'react-hot-toast';

type PassengerListView = Database['public']['Views']['v_admin_passengers_list']['Row'];
type PassengerInsert = Database['public']['Tables']['passengers']['Insert'];
type PassengerUpdate = Database['public']['Tables']['passengers']['Update'];

export const usePassengers = () => {
    const [passengers, setPassengers] = useState<PassengerListView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPassengers = async (includeArchived = false) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('v_admin_passengers_list')
                .select('*')
                .order('created_at', { ascending: false });

            if (!includeArchived) {
                query = query.is('archived_at', null);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setPassengers(data || []);
        } catch (err: any) {
            console.error('Error fetching passengers:', err);
            setError(err.message || 'Error al cargar pasajeros');
        } finally {
            setLoading(false);
        }
    };

    const createPassenger = async (passenger: PassengerInsert) => {
        try {
            const { data, error: insertError } = await supabase
                .from('passengers')
                .insert([{
                    ...passenger,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchPassengers(); // Refresh list
            return { data, error: null };
        } catch (err: any) {
            console.error('Error creating passenger:', err);
            return { data: null, error: err.message };
        }
    };

    const updatePassenger = async (id: string, updates: PassengerUpdate) => {
        try {
            const { data, error: updateError } = await supabase
                .from('passengers')
                .update({
                    ...updates,
                    updated_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchPassengers(); // Refresh list
            return { data, error: null };
        } catch (err: any) {
            console.error('Error updating passenger:', err);
            return { data: null, error: err.message };
        }
    };

    const archivePassenger = async (id: string) => {
        try {
            const { error: archiveError } = await supabase
                .from('passengers')
                .update({ archived_at: new Date().toISOString() })
                .eq('id', id);

            if (archiveError) throw archiveError;

            await fetchPassengers();
            return { error: null };
        } catch (err: any) {
            console.error('Error archiving passenger:', err);
            return { error: err.message };
        }
    };

    const restorePassenger = async (id: string) => {
        try {
            const { error: restoreError } = await supabase
                .from('passengers')
                .update({ archived_at: null })
                .eq('id', id);

            if (restoreError) throw restoreError;

            await fetchPassengers();
            return { error: null };
        } catch (err: any) {
            console.error('Error restoring passenger:', err);
            return { error: err.message };
        }
    };

    const permanentDeletePassenger = async (id: string) => {
        try {
            // Verify admin role before attempting deletion
            const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');

            if (roleError) throw roleError;

            if (roleData !== 'admin') {
                throw new Error('Solo los administradores pueden eliminar pasajeros permanentemente');
            }

            const { data, error: rpcError } = await supabase
                .rpc('delete_passenger_cascade', { passenger_id: id });

            if (rpcError) throw rpcError;
            if (!data.success) throw new Error(data.error);

            await fetchPassengers();
            return { error: null, data };
        } catch (err: any) {
            console.error('Error permanently deleting passenger:', err);
            return { error: err.message, data: null };
        }
    };

    const deletePassenger = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('passengers')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchPassengers(); // Refresh list
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting passenger:', err);
            return { error: err.message };
        }
    };

    useEffect(() => {
        fetchPassengers();
    }, []);

    return {
        passengers,
        loading,
        error,
        refetch: fetchPassengers,
        createPassenger,
        updatePassenger,
        deletePassenger,
        archivePassenger,
        restorePassenger,
        permanentDeletePassenger,
    };
};
