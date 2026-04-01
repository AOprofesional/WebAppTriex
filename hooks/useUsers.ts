import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

// Traduce los mensajes de error de Supabase / inglés al español
const traducirError = (mensaje: string): string => {
    if (!mensaje) return 'Ocurrió un error inesperado';
    const m = mensaje.toLowerCase();

    if (m.includes('already been registered') || m.includes('already registered') || m.includes('email address is already')) {
        return 'Ya existe un usuario registrado con ese correo electrónico';
    }
    if (m.includes('user already exists')) {
        return 'Ya existe un usuario con ese correo electrónico';
    }
    if (m.includes('invalid email')) {
        return 'El correo electrónico ingresado no es válido';
    }
    if (m.includes('password') && m.includes('weak')) {
        return 'La contraseña es demasiado débil';
    }
    if (m.includes('invalid session') || m.includes('expired token') || m.includes('jwt expired')) {
        return 'La sesión ha expirado. Por favor, volvé a iniciar sesión';
    }
    if (m.includes('unauthorized') || m.includes('not authorized')) {
        return 'No tenés permisos para realizar esta acción';
    }
    if (m.includes('no active session') || m.includes('no hay sesión')) {
        return 'No hay sesión activa. Por favor, iniciá sesión nuevamente';
    }
    if (m.includes('failed to create user')) {
        return 'No se pudo crear el usuario';
    }
    if (m.includes('failed to delete user')) {
        return 'No se pudo eliminar el usuario';
    }
    if (m.includes('failed to toggle')) {
        return 'No se pudo cambiar el estado del usuario';
    }
    if (m.includes('network') || m.includes('fetch')) {
        return 'Error de conexión. Verificá tu acceso a internet';
    }
    if (m.includes('insufficient permissions') || m.includes('only admins')) {
        return 'No tenés permisos suficientes. Solo los administradores pueden realizar esta acción';
    }
    if (m.includes('profile not found') || m.includes('could not verify user role')) {
        return 'No se pudo verificar el rol del usuario';
    }
    if (m.includes('email, full_name') || m.includes('are required')) {
        return 'Email, nombre completo y rol son obligatorios';
    }
    if (m.includes('server configuration') || m.includes('missing service role')) {
        return 'Error de configuración del servidor. Contactá al soporte técnico';
    }
    // Fallback: devolver el mensaje original si no hay traducción
    return mensaje;
};

interface User {
    id: string;
    email: string | null;
    full_name: string | null;
    role: 'passenger' | 'operator' | 'admin' | 'superadmin';
    created_at: string | null;
    updated_at: string | null;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    banned_until: string | null;
    phone: string | null;
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
                    updated_at,
                    banned_until,
                    phone
                `);
            query = query
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

    const createUser = async (data: { email: string; full_name: string; role: 'operator' | 'admin' | 'superadmin'; sendInvite?: boolean; phone?: string | null }) => {
        try {
            setLoading(true);

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('No hay sesión activa');
            }

            // Force refresh session to get a fresh access token
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            const currentSession = refreshData?.session;

            if (refreshError || !currentSession) {
                throw new Error('No active session or could not refresh token');
            }

            // Call Edge Function to create user
            const response = await fetch(
                `${supabaseUrl}/functions/v1/create-user`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${currentSession.access_token}`,
                        'apikey': supabaseAnonKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                }
            );

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to create user');
            }

            await fetchUsers();
            return { data: responseData.user, error: null };
        } catch (err: any) {
            console.error('Error creating user:', err);
            return { data: null, error: traducirError(err.message) };
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (
        userId: string,
        data: {
            full_name?: string;
            role?: 'operator' | 'admin' | 'superadmin';
            phone?: string | null;
        }
    ) => {
        try {
            setLoading(true);

            // Verify current user's role before updating to superadmin
            if (data.role === 'superadmin') {
                const { data: currentUser } = await supabase.auth.getUser();
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', currentUser.user?.id)
                    .single();

                if (profileError) throw profileError;

                if (profile?.role !== 'superadmin') {
                    throw new Error('Solo un Super Administrador puede asignar el rol de Super Administrador');
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: data.full_name,
                    role: data.role as any,
                    phone: data.phone
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

            // Force refresh session to get a fresh access token
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            const session = refreshData?.session;

            if (refreshError || !session) {
                throw new Error('No active session or could not refresh token');
            }

            // Call Edge Function to toggle user status
            const response = await fetch(
                `${supabaseUrl}/functions/v1/toggle-user-status`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': supabaseAnonKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, isActive }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to toggle user status');
            }

            await fetchUsers();
            return { error: null };
        } catch (err: any) {
            console.error('Error toggling user status:', err);
            return { error: traducirError(err.message) };
        } finally {
            setLoading(false);
        }
    };

    const sendPasswordReset = async (email: string) => {
        try {
            setLoading(true);

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#/update-password`
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

            // Force refresh session to get a fresh access token
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            const session = refreshData?.session;

            if (refreshError || !session) {
                throw new Error('No active session or could not refresh token');
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
            return { error: traducirError(err.message) };
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
