import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { Database } from '../types/database.types';
import toast from 'react-hot-toast';

type PassengerListView = Database['public']['Views']['v_admin_passengers_list']['Row'];
type PassengerInsert = Database['public']['Tables']['passengers']['Insert'];
type PassengerUpdate = Database['public']['Tables']['passengers']['Update'];

export const usePassengers = () => {
    const [passengers, setPassengers] = useState<PassengerListView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [totalCount, setTotalCount] = useState(0);

    const fetchPassengers = useCallback(async (
        page: number = 1,
        pageSize: number = 20,
        searchTerm: string = '',
        includeArchived = false,
        operatorFilter: string | null = null
    ) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('v_admin_passengers_list')
                .select('*', { count: 'exact' });

            const { data: roleData } = await supabase.rpc('get_my_role');
            const { data: authData } = await supabase.auth.getUser();
            
            if (roleData === 'operator' && authData.user) {
                query = query.eq('assigned_to', authData.user.id);
            } else if (operatorFilter) {
                if (operatorFilter === 'unassigned') {
                    query = query.is('assigned_to', null);
                } else {
                    query = query.eq('assigned_to', operatorFilter);
                }
            }

            if (!includeArchived) {
                query = query.is('archived_at', null);
            }

            if (searchTerm) {
                query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,passenger_email.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%,savia_file_number.ilike.%${searchTerm}%`);
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, count, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setPassengers(data || []);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error('Error fetching passengers:', err);
            setError(err.message || 'Error al cargar pasajeros');
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const createPassenger = async (passenger: PassengerInsert) => {
        try {
            const { data: authData } = await supabase.auth.getUser();
            const { data: roleData } = await supabase.rpc('get_my_role');
            
            const insertData: any = {
                ...passenger,
                created_by: authData.user?.id
            };
            
            if (roleData === 'operator' && authData.user) {
                insertData.assigned_to = authData.user.id;
            }

            const { data, error: insertError } = await supabase
                .from('passengers')
                .insert([insertData])
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
            const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');
            if (roleError) throw roleError;
            if (roleData !== 'admin') {
                throw new Error('Solo los administradores pueden eliminar pasajeros permanentemente');
            }

            // 1. Fetch passenger to get profile_id AND email (both needed for full cleanup)
            const { data: passenger, error: fetchError } = await supabase
                .from('passengers')
                .select('profile_id, email')
                .eq('id', id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw new Error('Error buscando datos del pasajero');
            }

            // 2. Delete the auth user via Edge Function:
            //    - If profile_id is set, use it directly (faster)
            //    - If profile_id is null (passenger never completed invite), 
            //      pass email so the Edge Function can find & delete the auth user
            if (passenger) {
                const { data: session } = await supabase.auth.getSession();
                const body: { userId?: string; email?: string } = {};

                if (passenger.profile_id) {
                    body.userId = passenger.profile_id;
                } else if (passenger.email) {
                    body.email = passenger.email;
                }

                if (body.userId || body.email) {
                    const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session?.session?.access_token}`
                        },
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        console.error('Warning: Failed to delete auth user:', errData);
                        // Don't throw — continue to delete the passenger row anyway
                    }
                }
            }

            // 3. Delete passenger row (cascade via RPC or direct delete)
            const { error: rpcError } = await supabase.rpc('delete_passenger_cascade', { passenger_id: id });

            if (rpcError) {
                console.warn('RPC delete_passenger_cascade falló, intentando delete directo...', rpcError);
                const { error: directDeleteError } = await supabase
                    .from('passengers')
                    .delete()
                    .eq('id', id);
                if (directDeleteError) throw directDeleteError;
            }

            // 4. Audit log
            const { data: authData } = await supabase.auth.getUser();
            if (authData.user) {
                await supabase.from('audit_log').insert({
                    user_id: authData.user.id,
                    action: 'DELETE_PASSENGER_CASCADE',
                    entity_type: 'passengers',
                    entity_id: id,
                    details: {
                        reason: 'permanent delete via UI',
                        passenger_email: passenger?.email,
                        profile_deleted: !!passenger?.profile_id
                    }
                });
            }

            await fetchPassengers();
            return { error: null, data: { success: true } };
        } catch (err: any) {
            console.error('Error permanently deleting passenger:', err);
            return { error: err.message, data: null };
        }
    };

    const deletePassenger = async (id: string) => {
        // Redirigir la antigua función a la nueva lógica mejorada
        return await permanentDeletePassenger(id);
    };

    useEffect(() => {
        fetchPassengers();
    }, []);

    return {
        passengers,
        loading,
        error,
        totalCount,
        refetch: fetchPassengers,
        createPassenger,
        updatePassenger,
        deletePassenger,
        archivePassenger,
        restorePassenger,
        permanentDeletePassenger,
    };
};
