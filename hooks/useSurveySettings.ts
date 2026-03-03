import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type SurveySettingsRow = Database['public']['Tables']['survey_settings']['Row'];

export interface SurveySettings {
    q1_text: string;
    q2_text: string;
    q3_text: string;
    comment_placeholder: string;
    google_review_url: string | null;
    is_active: boolean;
}

export const useSurveySettings = () => {
    const [settings, setSettings] = useState<SurveySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: err } = await supabase
                .from('survey_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (err) throw err;

            // In case there is no row yet, fallback to sensible defaults
            // (though our migration creates it)
            if (data) {
                setSettings({
                    q1_text: data.q1_text,
                    q2_text: data.q2_text,
                    q3_text: data.q3_text,
                    comment_placeholder: data.comment_placeholder,
                    google_review_url: data.google_review_url,
                    is_active: data.is_active
                });
            } else {
                // Should not happen with our migration
                throw new Error('Survey settings not found.');
            }
        } catch (err: any) {
            console.error('Error fetching survey settings:', err);
            // Default fallbacks so the app doesn't break if table is missing/empty magically
            setSettings({
                q1_text: '¿Qué tan probable es que nos recomiendes?',
                q2_text: '¿Cómo calificarías la organización general del viaje?',
                q3_text: '¿Cómo fue la atención del equipo?',
                comment_placeholder: 'Si querés, contanos qué fue lo mejor o qué podríamos mejorar…',
                google_review_url: 'https://g.page/r/placeholder/review',
                is_active: true
            });
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (updates: Partial<SurveySettings>) => {
        try {
            setUpdating(true);
            setError(null);

            const { error: err } = await supabase
                .from('survey_settings')
                .update(updates)
                .eq('id', 1);

            if (err) throw err;

            setSettings(prev => prev ? { ...prev, ...updates } : null);
            return { success: true };
        } catch (err: any) {
            console.error('Error updating survey settings:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setUpdating(false);
        }
    };

    return {
        settings,
        loading,
        error,
        updating,
        updateSettings,
        refetch: fetchSettings
    };
};
