import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadVoucher, getSignedUrl, deleteFile } from '../utils/storage';

export interface VoucherType {
    id: string;
    name: string;
    is_active: boolean;
}

export interface AdminVoucher {
    id: string;
    trip_id: string | null;
    passenger_id: string | null;
    type_id: string;
    title: string;
    provider_name: string | null;
    service_date: string | null;
    format: 'pdf' | 'image' | 'link';
    bucket: string | null;
    file_path: string | null;
    mime_type: string | null;
    size: number | null;
    external_url: string | null;
    notes: string | null;
    visibility: 'passenger_only' | 'all_trip_passengers';
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
    voucher_types?: { name: string };
    trips?: { name: string; destination: string };
    passengers?: { first_name: string; last_name: string };
}

export const useAdminVouchers = () => {
    const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
    const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchVoucherTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('voucher_types')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setVoucherTypes(data || []);
            return { data, error: null };
        } catch (err: any) {
            console.error('Error fetching voucher types:', err);
            return { data: null, error: err.message };
        }
    };

    const fetchAllVouchers = async (filters?: {
        typeId?: string;
        format?: string;
        tripId?: string;
        passengerId?: string;
        status?: string;
    }) => {
        try {
            setLoading(true);
            let query = supabase
                .from('vouchers')
                .select(`
                    *,
                    voucher_types(name),
                    trips(name, destination),
                    passengers(first_name, last_name)
                `)
                .order('created_at', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            } else {
                query = query.eq('status', 'active');
            }

            if (filters?.typeId) query = query.eq('type_id', filters.typeId);
            if (filters?.format) query = query.eq('format', filters.format);
            if (filters?.tripId) query = query.eq('trip_id', filters.tripId);
            if (filters?.passengerId) query = query.eq('passenger_id', filters.passengerId);

            const { data, error } = await query;

            if (error) throw error;
            setVouchers(data || []);
            return { data, error: null };
        } catch (err: any) {
            console.error('Error fetching vouchers:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const createVoucher = async (
        voucherData: {
            trip_id?: string | null;
            passenger_id?: string | null;
            type_id: string;
            title: string;
            provider_name?: string;
            service_date?: string;
            format: 'pdf' | 'image' | 'link';
            external_url?: string;
            notes?: string;
            visibility: 'passenger_only' | 'all_trip_passengers';
        },
        file?: File
    ) => {
        try {
            setLoading(true);

            // Create voucher record
            const { data: voucher, error: insertError } = await supabase
                .from('vouchers')
                .insert([{
                    ...voucherData,
                    status: 'active',
                    bucket: file ? 'triex-vouchers' : null,
                    file_path: null,
                    mime_type: null,
                    size: null
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // Upload file if provided
            if (file && voucher.trip_id) {
                const uploadResult = await uploadVoucher(
                    file,
                    voucher.trip_id,
                    voucher.id
                );

                if (uploadResult.error) throw new Error(uploadResult.error);

                // Update voucher with file metadata
                const { error: updateError } = await supabase
                    .from('vouchers')
                    .update({
                        bucket: uploadResult.bucket,
                        file_path: uploadResult.filePath,
                        mime_type: uploadResult.mimeType,
                        size: uploadResult.size
                    })
                    .eq('id', voucher.id);

                if (updateError) throw updateError;
            }

            // Create notifications for affected passengers
            await createVoucherNotifications(voucher);

            await fetchAllVouchers();
            return { data: voucher, error: null };
        } catch (err: any) {
            console.error('Error creating voucher:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateVoucher = async (
        id: string,
        voucherData: Partial<AdminVoucher>,
        file?: File
    ) => {
        try {
            setLoading(true);

            const { data: voucher, error: updateError } = await supabase
                .from('vouchers')
                .update(voucherData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Upload new file if provided
            if (file && voucher.trip_id) {
                const uploadResult = await uploadVoucher(
                    file,
                    voucher.trip_id,
                    id
                );

                if (uploadResult.error) throw new Error(uploadResult.error);

                const { error: fileUpdateError } = await supabase
                    .from('vouchers')
                    .update({
                        bucket: uploadResult.bucket,
                        file_path: uploadResult.filePath,
                        mime_type: uploadResult.mimeType,
                        size: uploadResult.size
                    })
                    .eq('id', id);

                if (fileUpdateError) throw fileUpdateError;
            }

            await fetchAllVouchers();
            return { data: voucher, error: null };
        } catch (err: any) {
            console.error('Error updating voucher:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const archiveVoucher = async (id: string) => {
        try {
            setLoading(true);

            const { error } = await supabase
                .from('vouchers')
                .update({ status: 'archived' })
                .eq('id', id);

            if (error) throw error;

            await fetchAllVouchers();
            return { error: null };
        } catch (err: any) {
            console.error('Error archiving voucher:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const restoreVoucher = async (id: string) => {
        try {
            setLoading(true);

            const { error } = await supabase
                .from('vouchers')
                .update({ status: 'active' })
                .eq('id', id);

            if (error) throw error;

            await fetchAllVouchers();
            return { error: null };
        } catch (err: any) {
            console.error('Error restoring voucher:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteVoucher = async (id: string) => {
        try {
            setLoading(true);

            // Get voucher data first to check for file
            const { data: voucher, error: fetchError } = await supabase
                .from('vouchers')
                .select('bucket, file_path')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Delete file from storage if exists
            if (voucher?.bucket && voucher?.file_path) {
                const { error: storageError } = await deleteFile(voucher.bucket as any, voucher.file_path);
                if (storageError) {
                    console.warn('Error deleting file from storage:', storageError);
                }
            }

            // Delete record
            const { error: deleteError } = await supabase
                .from('vouchers')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchAllVouchers();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting voucher:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const getVoucherSignedUrl = async (filePath: string) => {
        return await getSignedUrl('triex-vouchers', filePath);
    };

    const createVoucherNotifications = async (voucher: any) => {
        try {
            let passengerIds: string[] = [];

            if (voucher.visibility === 'all_trip_passengers' && voucher.trip_id) {
                const { data: tripPassengers } = await supabase
                    .from('trip_passengers')
                    .select('passenger_id')
                    .eq('trip_id', voucher.trip_id);

                passengerIds = tripPassengers?.map(tp => tp.passenger_id) || [];
            } else if (voucher.passenger_id) {
                passengerIds = [voucher.passenger_id];
            }

            if (passengerIds.length > 0) {
                const notifications = passengerIds.map(passengerId => ({
                    passenger_id: passengerId,
                    trip_id: voucher.trip_id,
                    type: 'vouchers_available' as const,
                    title: 'Nuevo voucher disponible',
                    message: `Se ha agregado un nuevo voucher: ${voucher.title}`,
                }));

                await supabase.from('notifications').insert(notifications);
            }
        } catch (err) {
            console.error('Error creating voucher notifications:', err);
        }
    };

    return {
        vouchers,
        voucherTypes,
        loading,
        fetchVoucherTypes,
        fetchAllVouchers,
        createVoucher,
        updateVoucher,
        archiveVoucher,
        restoreVoucher,
        deleteVoucher,
        getVoucherSignedUrl,
    };
};
