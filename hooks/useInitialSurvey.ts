import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface InitialSurveyData {
    rating_attention: number;
    info_clear: 'Sí' | 'Parcialmente' | 'No';
    understood_needs: 'Sí totalmente' | 'Más o menos' | 'No';
    booking_ease: number;
    nps: number;
    comment?: string;
}

export interface ExistingInitialSurvey {
    id: string;
    nps: number;
    rating_attention: number;
    info_clear: string;
    understood_needs: string;
    booking_ease: number;
    comment: string | null;
    responded_at: string;
}

export const useInitialSurvey = (passengerId: string | null) => {
    const [existingSurvey, setExistingSurvey] = useState<ExistingInitialSurvey | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (passengerId) {
            checkExistingSurvey();
        }
    }, [passengerId]);

    const checkExistingSurvey = async () => {
        if (!passengerId) return;
        try {
            setLoading(true);
            const { data, error: err } = await supabase
                .from('initial_surveys')
                .select('*')
                .eq('passenger_id', passengerId)
                .maybeSingle();

            if (err) throw err;
            setExistingSurvey(data ?? null);
        } catch (err: any) {
            console.error('Error checking initial survey:', err);
        } finally {
            setLoading(false);
        }
    };

    const submitSurvey = async (data: InitialSurveyData): Promise<boolean> => {
        if (!passengerId) return false;
        try {
            setSubmitting(true);
            setError(null);

            const { error: insertError } = await supabase
                .from('initial_surveys')
                .insert({
                    passenger_id: passengerId,
                    rating_attention: data.rating_attention,
                    info_clear: data.info_clear,
                    understood_needs: data.understood_needs,
                    booking_ease: data.booking_ease,
                    nps: data.nps,
                    comment: data.comment?.trim() || null,
                });

            if (insertError) {
                if (insertError.code === '23505' || (insertError as any).status === 409) {
                    throw new Error('Ya has enviado una encuesta inicial.');
                }
                throw insertError;
            }

            // Refresh to get the inserted row
            await checkExistingSurvey();
            return true;
        } catch (err: any) {
            console.error('Error submitting initial survey:', err);
            setError(err.message || 'No se pudo enviar la encuesta. Intente de nuevo.');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    return {
        existingSurvey,
        loading,
        submitting,
        error,
        submitSurvey,
    };
};
