import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { uploadProfilePhoto, deleteProfilePhoto } from '../utils/profileImageUpload';
import { queryCache } from '../lib/queryCache';
import { useAuth } from '../contexts/AuthContext';

export interface Passenger {
    id: string;
    profile_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    birth_date: string | null;
    document_type: string | null;
    document_number: string | null;
    cuil: string | null;
    avatar_url: string | null;
    is_orange_member?: boolean;
    orange_points_balance?: number;
    orange_referral_code?: string;
    notification_preferences: {
        push: boolean;
        email: boolean;
        categories: {
            trip_updates: boolean;
            document_reminders: boolean;
            payments: boolean;
            marketing: boolean;
        };
    };
    created_at: string;
}

export const usePassenger = () => {
    const { user, selectedPassengerId } = useAuth();
    const cacheKey = `passenger:${selectedPassengerId || user?.id || 'current'}`;

    // Get cached data synchronously on mount for instant transition (0ms)
    const initialCache = queryCache.get<Passenger>(cacheKey);

    const [passenger, setPassenger] = useState<Passenger | null>(initialCache?.data || null);
    const [loading, setLoading] = useState(!initialCache);
    const isFirstMount = useRef(true);

    const fetchPassenger = async (force: boolean = false) => {
        try {
            const currentCache = queryCache.get<Passenger>(cacheKey);
            // If we don't have cached data, show loading state
            if (!currentCache?.data) {
                setLoading(true);
            }

            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                setLoading(false);
                return;
            }

            let data: Passenger | null = null;

            if (selectedPassengerId) {
                // Fetch the specifically selected passenger
                const { data: pax, error } = await supabase
                    .from('passengers')
                    .select('*')
                    .eq('id', selectedPassengerId)
                    .single();

                if (error) {
                    console.error('Error fetching selected passenger:', error.message);
                } else {
                    data = pax;
                }
            } else {
                // Fallback (e.g. for operators accessing passenger profile context, or before selection)
                let { data: paxByProfile, error } = await supabase
                    .from('passengers')
                    .select('*')
                    .eq('profile_id', currentUser.id)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching passenger by profile_id:', error.message);
                }

                if (!paxByProfile && currentUser.email) {
                    const { data: fallback, error: fallbackError } = await supabase
                        .from('passengers')
                        .select('*')
                        .eq('email', currentUser.email)
                        .is('parent_passenger_id', null)
                        .order('created_at', { ascending: true })
                        .limit(1)
                        .maybeSingle();

                    if (fallbackError) {
                        console.error('Error fetching passenger by email:', fallbackError.message);
                    } else if (fallback) {
                        paxByProfile = fallback;
                        (async () => { await supabase.rpc('claim_passenger_by_email'); })();
                    }
                }

                data = paxByProfile;
            }

            if (data) {
                setPassenger(data);
                queryCache.set(cacheKey, data);
            }
        } catch (error: any) {
            console.error('Exception fetching passenger:', error?.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cached = queryCache.get<Passenger>(cacheKey);
        if (cached?.data) {
            setPassenger(cached.data);
            setLoading(false);
            // If data is fresh (< 60s), skip background revalidation
            if (cached.isFresh && isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }
        }

        isFirstMount.current = false;
        fetchPassenger();
    }, [selectedPassengerId, user?.id]);

    /**
     * Update passenger profile information
     */
    const updateProfile = async (updates: Partial<Passenger>): Promise<boolean> => {
        if (!passenger) return false;

        try {
            const { error } = await supabase
                .from('passengers')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', passenger.id);

            if (error) throw error;

            const updatedData = { ...passenger, ...updates };
            setPassenger(updatedData);
            queryCache.set(cacheKey, updatedData);
            queryCache.invalidate('passenger:*');
            return true;
        } catch (error: any) {
            console.error('Error updating profile:', error);
            throw new Error(`Failed to update profile: ${error.message}`);
        }
    };

    /**
     * Upload and set new avatar photo
     */
    const uploadAvatar = async (file: File): Promise<string> => {
        if (!passenger) throw new Error('No passenger loaded');

        try {
            if (passenger.avatar_url) {
                try {
                    await deleteProfilePhoto(passenger.avatar_url);
                } catch (err) {
                    console.warn('Could not delete old avatar:', err);
                }
            }

            const photoUrl = await uploadProfilePhoto(passenger.id, file);
            await updateProfile({ avatar_url: photoUrl });

            return photoUrl;
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            throw new Error(`Failed to upload avatar: ${error.message}`);
        }
    };

    /**
     * Remove avatar photo
     */
    const removeAvatar = async (): Promise<void> => {
        if (!passenger || !passenger.avatar_url) return;

        try {
            await deleteProfilePhoto(passenger.avatar_url);
            await updateProfile({ avatar_url: null });
        } catch (error: any) {
            console.error('Error removing avatar:', error);
            throw new Error(`Failed to remove avatar: ${error.message}`);
        }
    };

    /**
     * Update notification preferences
     */
    const updateNotificationPreferences = async (
        preferences: Passenger['notification_preferences']
    ): Promise<boolean> => {
        return updateProfile({ notification_preferences: preferences });
    };

    return {
        passenger,
        loading,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        updateNotificationPreferences,
        refetch: () => fetchPassenger(true),
    };
};
