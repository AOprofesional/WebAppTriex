import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: string | null;
    roleLoading: boolean;
    isArchived: boolean;
    signOut: () => Promise<void>;
    refreshRole: () => Promise<void>;
    availablePassengers: any[];
    selectedPassengerId: string | null;
    switchPassenger: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const [isArchived, setIsArchived] = useState(false);
    const [availablePassengers, setAvailablePassengers] = useState<any[]>([]);
    const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null);

    // Formatear mensaje y cerrar sesión
    const handleBanned = async () => {
        toast.error('Tu cuenta ha sido bloqueada. La sesión se cerrará.', { duration: 5000 });
        await signOut();
    };

    // Function to fetch and update role
    const refreshRole = async () => {
        setRoleLoading(true);
        if (!user) {
            setRole(null);
            setRoleLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.rpc('get_my_role');

            if (error) {
                // Check if it's an AbortError (from React Strict Mode)
                if (error.message?.includes('aborted')) {
                    console.log('Role fetch aborted (likely React Strict Mode)');
                } else {
                    console.error('Error getting user role:', JSON.stringify(error));
                }
                setRole(null);
            } else {
                console.log('Role fetched:', data);
                if (data === null) {
                    // Supabase get_my_role now returns null if the user is banned
                    handleBanned();
                } else {
                    setRole(data);
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Role fetch aborted (caught exception)');
            } else {
                console.error('Unexpected error fetching role:', err);
            }
            setRole(null);
        } finally {
            setRoleLoading(false);
        }
    };

    // Function to check if passenger is archived
    const checkArchivedStatus = async () => {
        if (!user) {
            setIsArchived(false);
            return;
        }

        try {
            const { data, error } = await supabase.rpc('is_passenger_archived');

            if (error) {
                // Check if it's an AbortError (from React Strict Mode)
                if (error.message?.includes('aborted')) {
                    console.log('Archived status check aborted (likely React Strict Mode)');
                } else {
                    console.error('Error checking archived status:', JSON.stringify(error));
                }
                setIsArchived(false);
                return;
            }

            setIsArchived(data === true);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Archived status check aborted (caught exception)');
            } else {
                console.error('Unexpected error checking archived status:', err);
            }
            setIsArchived(false);
        }
    };

    // Function to fetch available passengers for this profile (titular + companions)
    const fetchAvailablePassengers = async () => {
        if (!user) {
            setAvailablePassengers([]);
            setSelectedPassengerId(null);
            return;
        }

        try {
            // 1. Fetch primary passengers directly linked to this profile_id
            const { data: primaryData, error: primaryError } = await supabase
                .from('passengers')
                .select('*')
                .eq('profile_id', user.id)
                .is('archived_at', null)
                .order('created_at', { ascending: true });

            if (primaryError) throw primaryError;

            let allPassengers: any[] = primaryData || [];

            // If we found primary passenger(s), also fetch all companions linked by parent_passenger_id
            if (primaryData && primaryData.length > 0) {
                const primaryIds = primaryData.map(p => p.id);
                const { data: companions, error: compError } = await supabase
                    .from('passengers')
                    .select('*')
                    .in('parent_passenger_id', primaryIds)
                    .is('archived_at', null)
                    .order('created_at', { ascending: true });

                if (!compError && companions && companions.length > 0) {
                    const existingIds = new Set(allPassengers.map(p => p.id));
                    companions.forEach(c => {
                        if (!existingIds.has(c.id)) {
                            allPassengers.push(c);
                        }
                    });
                }
            } else if (user.email) {
                // Fallback: search by email
                const { data: byEmail } = await supabase
                    .from('passengers')
                    .select('*')
                    .eq('email', user.email)
                    .is('archived_at', null)
                    .order('created_at', { ascending: true });

                if (byEmail && byEmail.length > 0) {
                    allPassengers = byEmail;
                    const titulars = byEmail.filter(p => !p.parent_passenger_id);
                    if (titulars.length > 0) {
                        const titularIds = titulars.map(t => t.id);
                        const { data: companions } = await supabase
                            .from('passengers')
                            .select('*')
                            .in('parent_passenger_id', titularIds)
                            .is('archived_at', null)
                            .order('created_at', { ascending: true });

                        if (companions && companions.length > 0) {
                            const existingIds = new Set(allPassengers.map(p => p.id));
                            companions.forEach(c => {
                                if (!existingIds.has(c.id)) {
                                    allPassengers.push(c);
                                }
                            });
                        }
                    }
                }
            }

            setAvailablePassengers(allPassengers);

            // Check if there is an active selection in sessionStorage
            const savedPassengerId = sessionStorage.getItem('triex_selected_passenger_id');

            if (allPassengers.length === 1) {
                setSelectedPassengerId(allPassengers[0].id);
                sessionStorage.setItem('triex_selected_passenger_id', allPassengers[0].id);
            } else if (allPassengers.length > 1) {
                // If they have multiple (titular + companions)
                if (savedPassengerId && allPassengers.some(p => p.id === savedPassengerId)) {
                    setSelectedPassengerId(savedPassengerId);
                } else {
                    // Prompt user with ProfileSelector
                    setSelectedPassengerId(null);
                }
            } else {
                setSelectedPassengerId(null);
            }

        } catch (err) {
            console.error('Error fetching passengers:', err);
            setAvailablePassengers([]);
            setSelectedPassengerId(null);
        }
    };

    const switchPassenger = (id: string | null) => {
        if (id) {
            setSelectedPassengerId(id);
            sessionStorage.setItem('triex_selected_passenger_id', id);
        } else {
            setSelectedPassengerId(null);
            sessionStorage.removeItem('triex_selected_passenger_id');
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Auto-load role and archived status when user changes
    useEffect(() => {
        if (user) {
            refreshRole();
            checkArchivedStatus();
            fetchAvailablePassengers();

            // Setup Realtime subscription for banned_until changes
            const profileSubscription = supabase
                .channel(`public:profiles:id=eq.${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`,
                    },
                    (payload) => {
                        const newProfile = payload.new;
                        if (newProfile && newProfile.banned_until) {
                            console.log('User has been banned. Forcing logout.');
                            handleBanned();
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(profileSubscription);
            };
        } else {
            setRole(null);
            setIsArchived(false);
            setAvailablePassengers([]);
            setSelectedPassengerId(null);
        }
    }, [user]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setAvailablePassengers([]);
        setSelectedPassengerId(null);
    };

    const value = {
        user,
        session,
        loading,
        role,
        roleLoading,
        isArchived,
        signOut,
        refreshRole,
        availablePassengers,
        selectedPassengerId,
        switchPassenger,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
