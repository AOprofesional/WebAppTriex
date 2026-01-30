
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Voucher {
    id: string;
    trip_id: string | null;
    passenger_id: string | null;
    type_id: string;
    title: string;
    provider_name: string | null;
    service_date: string | null;
    format: 'pdf' | 'image' | 'link';
    external_url: string | null;
    bucket: string | null;
    file_path: string | null;
    mime_type: string | null;
    size: number | null;
    notes: string | null;
    visibility: 'passenger_only' | 'all_trip_passengers';
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
    type?: {
        id: string;
        name: string;
    };
}

interface UseVouchersFilters {
    tripId?: string;
    passengerId?: string;
}

export function useVouchers(filters?: UseVouchersFilters) {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVouchers = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('vouchers')
                .select('*, type:voucher_types(*)')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (filters?.tripId) {
                query = query.eq('trip_id', filters.tripId);
            }
            if (filters?.passengerId) {
                query = query.eq('passenger_id', filters.passengerId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setVouchers(data || []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch vouchers';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, [filters?.tripId, filters?.passengerId]);

    const createVoucher = async (voucher: Partial<Voucher>) => {
        const { data, error: createError } = await supabase
            .from('vouchers')
            .insert(voucher)
            .select()
            .single();

        if (createError) throw createError;
        await fetchVouchers();
        return data;
    };

    const updateVoucher = async (id: string, updates: Partial<Voucher>) => {
        const { error: updateError } = await supabase
            .from('vouchers')
            .update(updates)
            .eq('id', id);

        if (updateError) throw updateError;
        await fetchVouchers();
    };

    const deleteVoucher = async (id: string) => {
        // Soft delete: cambiar status a archived
        const { error: deleteError } = await supabase
            .from('vouchers')
            .update({ status: 'archived' })
            .eq('id', id);

        if (deleteError) throw deleteError;
        await fetchVouchers();
    };

    return {
        vouchers,
        loading,
        error,
        createVoucher,
        updateVoucher,
        deleteVoucher,
        refresh: fetchVouchers
    };
}
