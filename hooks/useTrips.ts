
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';
import { calculateTripStatus } from '../utils/dateUtils';
import { useEmailService, buildTripWelcomeEmailHtml } from './useEmailService';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripInsert = Database['public']['Tables']['trips']['Insert'];
type TripUpdate = Database['public']['Tables']['trips']['Update'];

export const useTrips = () => {
    const { sendEmail } = useEmailService();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = useCallback(async (
        page: number = 1,
        pageSize: number = 20,
        filters?: {
            statusOperational?: string;
            statusCommercial?: string;
            brandSub?: string;
            searchTerm?: string;
            startDate?: string;
            endDate?: string;
            status?: 'active' | 'archived' | 'all';
        }
    ) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('trips')
                .select('*, trip_passengers(count)', { count: 'exact' });

            // Status filter (active by default)
            const status = filters?.status || 'active';
            if (status === 'active') {
                query = query.is('archived_at', null);
            } else if (status === 'archived') {
                query = query.not('archived_at', 'is', null);
            }

            if (filters) {
                if (filters.statusCommercial && filters.statusCommercial !== 'all') {
                    query = query.eq('status_commercial', filters.statusCommercial);
                }
                if (filters.brandSub && filters.brandSub !== 'all') {
                    query = query.eq('brand_sub', filters.brandSub);
                }
                if (filters.searchTerm) {
                    query = query.or(`name.ilike.%${filters.searchTerm}%,destination.ilike.%${filters.searchTerm}%,internal_code.ilike.%${filters.searchTerm}%`);
                }
                if (filters.startDate) {
                    query = query.gte('start_date', filters.startDate);
                }
                if (filters.endDate) {
                    query = query.lte('end_date', filters.endDate);
                }

                // Operational Status Filtering (Server-side)
                if (filters.statusOperational && filters.statusOperational !== 'all') {
                    // We construct a simple date constraint based on today's start/end
                    const nowStart = new Date();
                    nowStart.setHours(0, 0, 0, 0);
                    const nowStartISO = nowStart.toISOString();

                    const nowEnd = new Date();
                    nowEnd.setHours(23, 59, 59, 999);
                    const nowEndISO = nowEnd.toISOString();

                    if (filters.statusOperational === 'PREVIO') {
                        query = query.gt('start_date', nowStartISO);
                    } else if (filters.statusOperational === 'EN_CURSO') {
                        query = query.lte('start_date', nowStartISO).gte('end_date', nowEndISO);
                    } else if (filters.statusOperational === 'FINALIZADO') {
                        query = query.lt('end_date', nowStartISO);
                    }
                }
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            query = query.order('start_date', { ascending: false }).range(from, to);

            const { data, count, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setTrips(data || []);
            setTotalCount(count || 0);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching trips:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createTrip = async (tripData: TripInsert) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error: insertError } = await supabase
                .from('trips')
                .insert({
                    ...tripData,
                    created_by: user?.id,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchTrips();
            return { data, error: null };
        } catch (err: any) {
            console.error('Error creating trip:', err);
            return { data: null, error: err.message };
        }
    };

    const updateTrip = async (id: string, tripData: TripUpdate) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error: updateError } = await supabase
                .from('trips')
                .update({
                    ...tripData,
                    updated_by: user?.id,
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchTrips();
            return { data, error: null };
        } catch (err: any) {
            console.error('Error updating trip:', err);
            return { data: null, error: err.message };
        }
    };

    const archiveTrip = async (id: string) => {
        try {
            const { error: archiveError } = await supabase
                .from('trips')
                .update({ archived_at: new Date().toISOString() })
                .eq('id', id);

            if (archiveError) throw archiveError;

            await fetchTrips();
            return { error: null };
        } catch (err: any) {
            console.error('Error archiving trip:', err);
            return { error: err.message };
        }
    };

    const restoreTrip = async (id: string) => {
        try {
            const { error: restoreError } = await supabase
                .from('trips')
                .update({ archived_at: null })
                .eq('id', id);

            if (restoreError) throw restoreError;

            await fetchTrips();
            return { error: null };
        } catch (err: any) {
            console.error('Error restoring trip:', err);
            return { error: err.message };
        }
    };

    const deleteTrip = async (id: string) => {
        try {
            // Verify admin role before attempting deletion
            const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');
            if (roleError) throw roleError;
            if (roleData !== 'admin' && roleData !== 'superadmin') { // Check for superadmin too just in case
                throw new Error('Solo los administradores pueden eliminar viajes permanentemente');
            }

            const { error: deleteError } = await supabase
                .from('trips')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchTrips();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting trip:', err);
            return { error: err.message };
        }
    };

    const getTripById = async (id: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            return { data, error: null };
        } catch (err: any) {
            console.error('Error fetching trip:', err);
            return { data: null, error: err.message };
        }
    };

    const duplicateTrip = async (id: string) => {
        try {
            const { data: source, error: fetchError } = await getTripById(id);
            if (fetchError) throw new Error(fetchError);
            if (!source) throw new Error('No se encontró el viaje a duplicar');

            // Strip fields that should not be copied
            const {
                id: _id,
                created_at: _created_at,
                updated_at: _updated_at,
                archived_at: _archived_at,
                created_by: _created_by,
                updated_by: _updated_by,
                internal_code: _internal_code,
                ...copyable
            } = source as any;

            const newTripData: TripInsert = {
                ...copyable,
                name: `Copia de ${source.name}`,
            };

            return await createTrip(newTripData);
        } catch (err: any) {
            console.error('Error duplicating trip:', err);
            return { data: null, error: err.message };
        }
    };

    const assignPassengers = async (tripId: string, passengerIds: string[]) => {
        try {
            // Get existing assignments
            const { data: existing, error: fetchError } = await supabase
                .from('trip_passengers')
                .select('passenger_id')
                .eq('trip_id', tripId);

            if (fetchError) throw fetchError;

            const existingIds = existing?.map(e => e.passenger_id) || [];

            // IDs to add (not in existing)
            const toAdd = passengerIds.filter(id => !existingIds.includes(id));

            // IDs to remove (in existing but not in new selection)
            const toRemove = existingIds.filter(id => !passengerIds.includes(id));

            // Delete removed assignments
            if (toRemove.length > 0) {
                const { error: deleteError } = await supabase
                    .from('trip_passengers')
                    .delete()
                    .eq('trip_id', tripId)
                    .in('passenger_id', toRemove);

                if (deleteError) throw deleteError;
            }

            // Insert new assignments
            if (toAdd.length > 0) {
                const { error: insertError } = await supabase
                    .from('trip_passengers')
                    .insert(toAdd.map(pid => ({ trip_id: tripId, passenger_id: pid })));

                if (insertError) throw insertError;

                // Send Welcome emails (non-blocking)
                try {
                    const { data: trip } = await supabase
                        .from('trips')
                        .select('name, destination, start_date, end_date')
                        .eq('id', tripId)
                        .single();

                    if (trip) {
                        const { data: addPassengers } = await supabase
                            .from('passengers')
                            .select('email, first_name')
                            .in('id', toAdd);

                        if (addPassengers && addPassengers.length > 0) {
                            addPassengers.forEach(p => {
                                if (p.email) {
                                    sendEmail({
                                        to: p.email,
                                        subject: '¡Viaje Asignado! 🎉',
                                        html: buildTripWelcomeEmailHtml({
                                            firstName: p.first_name || 'Pasajero',
                                            tripName: trip.name,
                                            destination: trip.destination,
                                            startDate: new Date(trip.start_date || '').toLocaleDateString('es-AR'),
                                            endDate: new Date(trip.end_date || '').toLocaleDateString('es-AR')
                                        })
                                    }).catch(err => console.error('Error sending welcome email to:', p.email, err));
                                }
                            });
                        }
                    }
                } catch (emailErr) {
                    console.error('Error in welcome email dispatch:', emailErr);
                }
            }

            return { error: null };
        } catch (err: any) {
            console.error('Error assigning passengers:', err);
            return { error: err.message };
        }
    };

    return {
        trips,
        loading,
        error,
        totalCount,
        fetchTrips,
        createTrip,
        updateTrip,
        archiveTrip,
        restoreTrip,
        deleteTrip,
        getTripById,
        duplicateTrip,
        assignPassengers,
    };
};
