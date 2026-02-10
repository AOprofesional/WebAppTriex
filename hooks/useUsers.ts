import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

interface User {
    id: string;
    email: string | null;
    full_name: string | null;
    role: 'passenger' | 'operator' | 'admin' | 'superadmin';
    created_at: string | null;
    updated_at: string | null;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
}

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async (roleFilter?: string) => {
        try {
            setLoading(true);

            // Query profiles joined with auth.users metadata
            let query = supabase
                .from('profiles')
                .select(`
                    id,
                    email,
                    full_name,
                    role,
                    created_at,
                    updated_at
                `)
                .in('role', ['operator', 'admin', 'superadmin'])
                .order('created_at', { ascending: false });

            if (roleFilter) {
                query = query.eq('role', roleFilter);
            }

            const { data: profiles, error: profilesError } = await query;

            if (profilesError) throw profilesError;

            // Get auth metadata for each user
            const usersWithAuth = await Promise.all(
                (profiles || []).map(async (profile) => {
                    // Note: We can't directly query auth.users, so we get metadata via admin API
                    // For now, we'll fetch this separately if needed
                    return {
                        ...profile,
                        last_sign_in_at: null,
                        email_confirmed_at: null
                    };
                })
            );

            setUsers(usersWithAuth);
            return { data: usersWithAuth, error: null };
        } catch (err: any) {
            console.error('Error fetching users:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const createUser = async (userData: {
        email: string;
        full_name: string;
        role: 'operator' | 'admin' | 'superadmin';
        sendInvite?: boolean;
    }) => {
        try {
            setLoading(true);

            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('No active session');
            }

            // Call Edge Function to create user
            const response = await fetch(
                `${supabaseUrl}/functions/v1/create-user`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': supabaseAnonKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            await fetchUsers();
            return { data: data.user, error: null };
        } catch (err: any) {
            console.error('Error creating user:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (
        userId: string,
        updates: {
            full_name?: string;
            role?: 'operator' | 'admin' | 'superadmin';
        }
    ) => {
        try {
            setLoading(true);

            // Verify current user's role before updating to superadmin
            if (updates.role === 'superadmin') {
                const { data: currentUser } = await supabase.auth.getUser();
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', currentUser.user?.id)
                    .single();

                if (profile?.role !== 'superadmin') {
                    throw new Error('Solo un Super Administrador puede asignar el rol de Super Administrador');
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            await fetchUsers();
            return { error: null };
        } catch (err: any) {
            console.error('Error updating user:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string, isActive: boolean) => {
        try {
            setLoading(true);

            // Use Supabase Admin API to ban/unban user
            if (isActive) {
                // Unban user (remove ban)
                const { error } = await supabase.auth.admin.updateUserById(userId, {
                    ban_duration: 'none'
                });
                if (error) throw error;
            } else {
                // Ban user indefinitely
                const { error } = await supabase.auth.admin.updateUserById(userId, {
                    ban_duration: '876000h' // ~100 years
                });
                if (error) throw error;
            }

            await fetchUsers();
            return { error: null };
        } catch (err: any) {
            console.error('Error toggling user status:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const sendPasswordReset = async (email: string) => {
        try {
            setLoading(true);

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`
            });

            if (error) throw error;

            return { error: null };
        } catch (err: any) {
            console.error('Error sending password reset:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            setLoading(true);

            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('No active session');
            }

            // Call Edge Function to delete user
            const response = await fetch(
                `${supabaseUrl}/functions/v1/delete-user`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': supabaseAnonKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user');
            }

            await fetchUsers();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting user:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return {
        users,
        loading,
        fetchUsers,
        createUser,
        updateUser,
        toggleUserStatus,
        sendPasswordReset,
        deleteUser
    };
};
