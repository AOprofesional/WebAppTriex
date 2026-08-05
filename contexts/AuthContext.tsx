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
    const fetchAvailablePassengers = async (currentUser?: any) => {
        const u = currentUser || user;
        if (!u) {
            setAvailablePassengers([]);
            setSelectedPassengerId(null);
            return;
        }

        try {
            console.log('[AuthContext] Starting fetchAvailablePassengers for:', u.id, u.email);

            // 1. Fetch by profile_id
            const { data: byProfile, error: errProfile } = await supabase
                .from('passengers')
                .select('*')
                .eq('profile_id', u.id)
                .is('archived_at', null)
                .order('created_at', { ascending: true });

            if (errProfile) console.warn('[AuthContext] Error fetching by profile_id:', errProfile);

            // 2. Fetch by email (both titular and companions who share the email)
            let byEmail: any[] = [];
            if (u.email) {
                const cleanEmail = u.email.trim();
                const { data, error: errEmail } = await supabase
                    .from('passengers')
                    .select('*')
                    .ilike('email', cleanEmail)
                    .is('archived_at', null)
                    .order('created_at', { ascending: true });

                if (errEmail) console.warn('[AuthContext] Error fetching by email:', errEmail);
                if (data) byEmail = data;
            }

            const passengerMap = new Map<string, any>();
            (byProfile || []).forEach((p: any) => passengerMap.set(p.id, p));
            (byEmail || []).forEach((p: any) => passengerMap.set(p.id, p));

            // 3. Fetch companions linked to any discovered passenger
            const knownIds = Array.from(passengerMap.keys());
            if (knownIds.length > 0) {
                const { data: companions, error: errComp } = await supabase
                    .from('passengers')
                    .select('*')
                    .in('parent_passenger_id', knownIds)
                    .is('archived_at', null)
                    .order('created_at', { ascending: true });

                if (errComp) console.warn('[AuthContext] Error fetching companions:', errComp);
                (companions || []).forEach((p: any) => passengerMap.set(p.id, p));
            }

            // 4. Also check if this user is a companion whose parent is another passenger
            const parentIds = Array.from(passengerMap.values())
                .map((p: any) => p.parent_passenger_id)
                .filter(Boolean);

            if (parentIds.length > 0) {
                const { data: parents, error: errParent } = await supabase
                    .from('passengers')
                    .select('*')
                    .in('id', parentIds)
                    .is('archived_at', null);

                if (errParent) console.warn('[AuthContext] Error fetching parents:', errParent);
                (parents || []).forEach((p: any) => passengerMap.set(p.id, p));

                const { data: siblings, error: errSiblings } = await supabase
                    .from('passengers')
                    .select('*')
                    .in('parent_passenger_id', parentIds)
                    .is('archived_at', null);

                if (errSiblings) console.warn('[AuthContext] Error fetching sibling companions:', errSiblings);
                (siblings || []).forEach((p: any) => passengerMap.set(p.id, p));
            }

            const allPassengers = Array.from(passengerMap.values());
            console.log('[AuthContext] Total available passengers discovered:', allPassengers.length, allPassengers);

            setAvailablePassengers(allPassengers);

            if (allPassengers.length === 1) {
                // If only 1 passenger exists, select it automatically
                setSelectedPassengerId(allPassengers[0].id);
            } else if (allPassengers.length > 1) {
                // If 2 or more passengers exist, NEVER auto-select on load/login!
                // Keep selection ONLY if the user has ALREADY made an explicit in-memory choice in this active session
                setSelectedPassengerId((prev) => {
                    if (prev && allPassengers.some((p: any) => p.id === prev)) {
                        return prev;
                    }
                    return null; // Will show the ProfileSelector modal!
                });
            } else {
                setSelectedPassengerId(null);
            }

        } catch (err) {
            console.error('[AuthContext] Error fetching passengers:', err);
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
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);
            if (currentUser) {
                fetchAvailablePassengers(currentUser);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);
            if (event === 'SIGNED_IN') {
                sessionStorage.removeItem('triex_selected_passenger_id');
                setSelectedPassengerId(null);
            }
            if (currentUser) {
                fetchAvailablePassengers(currentUser);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Auto-load role and archived status when user changes
    useEffect(() => {
        if (user) {
            refreshRole();
            checkArchivedStatus();
            fetchAvailablePassengers(user);

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
