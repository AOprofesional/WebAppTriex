import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SurveyData {
    nps: number;
    rating_organization: number;
    rating_attention: number;
    comment?: string;
}

export interface ExistingSurvey {
    id: string;
    nps: number;
    rating_organization: number;
    rating_attention: number;
    comment: string | null;
    responded_at: string;
}

export const useSurvey = (tripId: string | null, passengerId: string | null) => {
    const [existingSurvey, setExistingSurvey] = useState<ExistingSurvey | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (tripId && passengerId) {
            checkExistingSurvey();
        }
    }, [tripId, passengerId]);

    const checkExistingSurvey = async () => {
        if (!tripId || !passengerId) return;
        try {
            setLoading(true);
            const { data, error: err } = await supabase
                .from('trip_surveys')
                .select('id, nps, rating_organization, rating_attention, comment, responded_at')
                .eq('trip_id', tripId)
                .eq('passenger_id', passengerId)
                .maybeSingle();

            if (err) throw err;
            setExistingSurvey(data ?? null);
        } catch (err: any) {
            console.error('Error checking survey:', err);
        } finally {
            setLoading(false);
        }
    };

    const submitSurvey = async (data: SurveyData): Promise<boolean> => {
        if (!tripId || !passengerId) return false;
        try {
            setSubmitting(true);
            setError(null);

            const { error: insertError } = await supabase
                .from('trip_surveys')
                .insert({
                    trip_id: tripId,
                    passenger_id: passengerId,
                    nps: data.nps,
                    rating_organization: data.rating_organization,
                    rating_attention: data.rating_attention,
                    comment: data.comment?.trim() || null,
                });

            if (insertError) {
                if (insertError.code === '23505' || insertError.status === 409) {
                    throw new Error('Ya has enviado una encuesta para este viaje.');
                }
                throw insertError;
            }

            // Refresh to get the inserted row
            await checkExistingSurvey();
            return true;
        } catch (err: any) {
            console.error('Error submitting survey:', err);
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
