import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type SettingKey = 'dark_mode' | 'email_notifications' | 'push_notifications' | 'timezone' | 'language';

export interface Setting {
    key: SettingKey;
    value: any;
}

export const useSettings = () => {
    const [settings, setSettings] = useState<Record<SettingKey, any>>({
        dark_mode: document.documentElement.classList.contains('dark'),
        email_notifications: true,
        push_notifications: false,
        timezone: 'America/Buenos_Aires',
        language: 'Español'
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch all settings for current user
    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('admin_settings')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            // Convert array to object
            const settingsObj: Record<string, any> = {
                dark_mode: document.documentElement.classList.contains('dark'),
                email_notifications: true,
                push_notifications: false,
                timezone: 'America/Buenos_Aires',
                language: 'Español'
            };

            data?.forEach((setting) => {
                settingsObj[setting.setting_key] = setting.setting_value;
            });

            setSettings(settingsObj);

            // Apply dark mode setting
            if (settingsObj.dark_mode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('dark-mode', 'true');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('dark-mode', 'false');
            }

        } catch (err: any) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Update a single setting
    const updateSetting = async (key: SettingKey, value: any) => {
        try {
            setSaving(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Upsert setting
            const { error } = await supabase
                .from('admin_settings')
                .upsert({
                    user_id: user.id,
                    setting_key: key,
                    setting_value: value
                }, {
                    onConflict: 'user_id,setting_key'
                });

            if (error) throw error;

            // Update local state
            setSettings(prev => ({ ...prev, [key]: value }));

            // Apply dark mode immediately if changed
            if (key === 'dark_mode') {
                if (value) {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('dark-mode', 'true');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('dark-mode', 'false');
                }
            }

            return { error: null };
        } catch (err: any) {
            console.error('Error updating setting:', err);
            return { error: err.message };
        } finally {
            setSaving(false);
        }
    };

    // Update multiple settings at once
    const updateSettings = async (updates: Partial<Record<SettingKey, any>>) => {
        try {
            setSaving(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Prepare upsert data
            const upsertData = Object.entries(updates).map(([key, value]) => ({
                user_id: user.id,
                setting_key: key,
                setting_value: value
            }));

            const { error } = await supabase
                .from('admin_settings')
                .upsert(upsertData, {
                    onConflict: 'user_id,setting_key'
                });

            if (error) throw error;

            // Update local state
            setSettings(prev => ({ ...prev, ...updates }));

            // Apply dark mode immediately if changed
            if ('dark_mode' in updates) {
                if (updates.dark_mode) {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('dark-mode', 'true');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('dark-mode', 'false');
                }
            }

            return { error: null };
        } catch (err: any) {
            console.error('Error updating settings:', err);
            return { error: err.message };
        } finally {
            setSaving(false);
        }
    };

    // Get a specific setting value
    const getSetting = (key: SettingKey) => {
        return settings[key];
    };

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return {
        settings,
        loading,
        saving,
        updateSetting,
        updateSettings,
        getSetting,
        refetch: fetchSettings
    };
};
