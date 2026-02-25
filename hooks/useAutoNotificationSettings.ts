import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AutoNotificationSetting {
    id: string;
    event_key: string;
    event_name: string;
    trigger_description: string;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export const useAutoNotificationSettings = () => {
    const [settings, setSettings] = useState<AutoNotificationSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();

        // Real-time subscription for settings changes
        const channelId = `auto-notification-settings-changes-${Math.random().toString(36).substring(7)}`;
        const channel = supabase
            .channel(channelId)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'auto_notification_settings' },
                () => {
                    fetchSettings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('auto_notification_settings')
                .select('*')
                .order('event_name');

            if (fetchError) throw fetchError;

            setSettings(data || []);
            return { data, error: null };
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching auto notification settings:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (id: string, isEnabled: boolean) => {
        try {
            const { error: updateError } = await supabase
                .from('auto_notification_settings')
                .update({ is_enabled: isEnabled })
                .eq('id', id);

            if (updateError) throw updateError;

            // Optimistically update local state
            setSettings(prev =>
                prev.map(setting =>
                    setting.id === id ? { ...setting, is_enabled: isEnabled } : setting
                )
            );

            return { error: null };
        } catch (err: any) {
            console.error('Error updating setting:', err);
            return { error: err.message };
        }
    };

    const isEnabled = (eventKey: string): boolean => {
        const setting = settings.find(s => s.event_key === eventKey);
        return setting?.is_enabled ?? true; // Default to enabled if not found
    };

    return {
        settings,
        loading,
        error,
        fetchSettings,
        updateSetting,
        isEnabled,
    };
};

// Utility function for checking settings outside of React components
export const checkNotificationEnabled = async (eventKey: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('auto_notification_settings')
            .select('is_enabled')
            .eq('event_key', eventKey)
            .single();

        if (error) {
            console.warn('Error checking notification setting, defaulting to enabled:', error);
            return true;
        }

        return data?.is_enabled ?? true;
    } catch (err) {
        console.warn('Error checking notification setting, defaulting to enabled:', err);
        return true;
    }
};
