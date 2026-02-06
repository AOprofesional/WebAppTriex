
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadProfilePhoto, deleteProfilePhoto } from '../utils/profileImageUpload';

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
    const [passenger, setPassenger] = useState<Passenger | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPassenger = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('passengers')
                .select('*')
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

    useEffect(() => {
        fetchPassenger();
    }, []);

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

            // Refresh passenger data
            await fetchPassenger();
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
            // Delete old avatar if exists
            if (passenger.avatar_url) {
                try {
                    await deleteProfilePhoto(passenger.avatar_url);
                } catch (err) {
                    console.warn('Could not delete old avatar:', err);
                }
            }

            // Upload new photo
            const photoUrl = await uploadProfilePhoto(passenger.id, file);

            // Update passenger record
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
        refetch: fetchPassenger,
    };
};
