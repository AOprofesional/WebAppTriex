
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const usePassenger = () => {
    const [passenger, setPassenger] = useState<{ id: string; first_name: string; last_name: string; email: string; } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPassenger = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('passengers')
                    .select('id, first_name, last_name, email')
                    .eq('profile_id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching passenger:', error);
                } else {
                    setPassenger(data);
                }
            } catch (error) {
                console.error('Exception fetching passenger:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPassenger();
    }, []);

    return { passenger, loading };
};
