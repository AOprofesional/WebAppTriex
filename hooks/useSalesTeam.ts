import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Database } from '../types/database.types';

export type SalesTeamMember = Database['public']['Tables']['sales_team']['Row'];
export type SalesTeamInsert = Database['public']['Tables']['sales_team']['Insert'];

export const useSalesTeam = () => {
    const [team, setTeam] = useState<SalesTeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTeam = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('sales_team')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;
            setTeam(data || []);
        } catch (error) {
            console.error('Error fetching sales team:', error);
            toast.error('Error al cargar el equipo de ventas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    const addMember = async (member: SalesTeamInsert) => {
        try {
            const { error } = await supabase
                .from('sales_team')
                .insert([member]);

            if (error) throw error;
            toast.success('Miembro agregado correctamente');
            fetchTeam();
            return true;
        } catch (error) {
            console.error('Error adding member:', error);
            toast.error('Error al agregar el miembro');
            return false;
        }
    };

    const updateMember = async (id: string, updates: Partial<SalesTeamInsert>) => {
        try {
            const { error } = await supabase
                .from('sales_team')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            toast.success('Miembro actualizado correctamente');
            fetchTeam();
            return true;
        } catch (error) {
            console.error('Error updating member:', error);
            toast.error('Error al actualizar el miembro');
            return false;
        }
    };

    const deleteMember = async (id: string) => {
        try {
            const { error } = await supabase
                .from('sales_team')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Miembro eliminado correctamente');
            fetchTeam();
            return true;
        } catch (error) {
            console.error('Error deleting member:', error);
            toast.error('Error al eliminar el miembro');
            return false;
        }
    };

    const reorderTeam = async (newOrder: { id: string, order_index: number }[]) => {
        try {
            // Optimistic update
            setTeam(prev => {
                const updated = [...prev];
                newOrder.forEach(item => {
                    const idx = updated.findIndex(m => m.id === item.id);
                    if (idx !== -1) updated[idx].order_index = item.order_index;
                });
                return updated.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            });

            // Upsert or multiple updates (Supabase doesn't have bulk update easily except via upsert with PK)
            const { error } = await supabase
                .from('sales_team')
                .upsert(newOrder.map(item => ({ id: item.id, order_index: item.order_index })));

            if (error) throw error;
        } catch (error) {
            console.error('Error reordering team:', error);
            toast.error('Error al reordenar el equipo');
            fetchTeam(); // revert
        }
    };

    return {
        team,
        loading,
        refetch: fetchTeam,
        addMember,
        updateMember,
        deleteMember,
        reorderTeam
    };
};
