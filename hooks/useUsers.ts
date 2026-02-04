import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

            // Verify current user's role before creating superadmin
            if (userData.role === 'superadmin') {
                const { data: currentUser } = await supabase.auth.getUser();
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', currentUser.user?.id)
                    .single();

                if (profile?.role !== 'superadmin') {
                    throw new Error('Solo un Super Administrador puede crear otros Super Administradores');
                }
            }

            // Create user via Supabase Auth Admin API
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: userData.email,
                email_confirm: true,
                user_metadata: {
                    full_name: userData.full_name
                }
            });

            if (authError) throw authError;

            // Update profile with role and full_name
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: userData.full_name,
                    role: userData.role,
                    email: userData.email
                })
                .eq('id', authData.user.id);

            if (profileError) throw profileError;

            // Send invitation email if requested
            if (userData.sendInvite !== false) {
                await supabase.auth.resetPasswordForEmail(userData.email, {
                    redirectTo: `${window.location.origin}/update-password`
                });
            }

            await fetchUsers();
            return { data: authData.user, error: null };
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

            // Soft delete by setting role to a disabled state or using ban
            // Or hard delete via admin API
            const { error } = await supabase.auth.admin.deleteUser(userId);

            if (error) throw error;

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
