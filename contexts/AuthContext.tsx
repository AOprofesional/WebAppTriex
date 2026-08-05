import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

    // Guard para evitar llamadas concurrentes/duplicadas a fetchAvailablePassengers
    const isFetchingPassengers = useRef(false);
    const lastFetchedUserId = useRef<string | null>(null);

    const handleBanned = async () => {
        toast.error('Tu cuenta ha sido bloqueada. La sesión se cerrará.', { duration: 5000 });
        await signOut();
    };

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
                if (!error.message?.includes('aborted')) {
                    console.error('[Auth] Error getting user role:', error.code);
                }
                setRole(null);
            } else {
                if (data === null) {
                    handleBanned();
                } else {
                    setRole(data);
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('[Auth] Unexpected error fetching role:', err.code ?? err.name);
            }
            setRole(null);
        } finally {
            setRoleLoading(false);
        }
    };

    const checkArchivedStatus = async () => {
        if (!user) {
            setIsArchived(false);
            return;
        }
        try {
            const { data, error } = await supabase.rpc('is_passenger_archived');
            if (error && !error.message?.includes('aborted')) {
                console.error('[Auth] Error checking archived status:', error.code);
            }
            setIsArchived(data === true);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('[Auth] Unexpected error checking archived status:', err.code ?? err.name);
            }
            setIsArchived(false);
        }
    };

    // Carga los pasajeros disponibles para este perfil (titular + acompañantes).
    // Protegido con guard para evitar llamadas duplicadas durante el ciclo de auth.
    const fetchAvailablePassengers = async (currentUser?: any) => {
        const u = currentUser || user;
        if (!u) {
            setAvailablePassengers([]);
            setSelectedPassengerId(null);
            return;
        }

        // Evitar llamadas concurrentes o repetidas para el mismo usuario
        if (isFetchingPassengers.current) return;
        if (lastFetchedUserId.current === u.id) return;

        isFetchingPassengers.current = true;
        lastFetchedUserId.current = u.id;

        try {
            const passengerMap = new Map<string, any>();

            // 0. RPC principal (SECURITY DEFINER, bypasses RLS safely)
            try {
                const { data: rpcData, error: rpcErr } = await supabase.rpc('get_my_available_passengers');
                if (!rpcErr && rpcData && rpcData.length > 0) {
                    rpcData.forEach((p: any) => passengerMap.set(p.id, p));
                } else if (rpcErr) {
                    console.warn('[Auth] get_my_available_passengers RPC error:', rpcErr.code);
                }
            } catch {
                // Ignorar: el fallback a queries directas sigue adelante
            }

            // 1. Fallback: buscar por profile_id
            const { data: byProfile, error: errProfile } = await supabase
                .from('passengers')
                .select('*')
                .eq('profile_id', u.id)
                .is('archived_at', null)
                .order('created_at', { ascending: true });

            if (errProfile) console.warn('[Auth] Error by profile_id:', errProfile.code);
            (byProfile || []).forEach((p: any) => passengerMap.set(p.id, p));

            // 2. Fallback: buscar por email
            if (u.email) {
                const { data: byEmail, error: errEmail } = await supabase
                    .from('passengers')
                    .select('*')
                    .ilike('email', u.email.trim())
                    .is('archived_at', null)
                    .order('created_at', { ascending: true });

                if (errEmail) console.warn('[Auth] Error by email:', errEmail.code);
                (byEmail || []).forEach((p: any) => passengerMap.set(p.id, p));
            }

            // 3. Acompañantes vinculados por parent_passenger_id
            const knownIds = Array.from(passengerMap.keys());
            if (knownIds.length > 0) {
                const { data: companions, error: errComp } = await supabase
                    .from('passengers')
                    .select('*')
                    .in('parent_passenger_id', knownIds)
                    .is('archived_at', null)
                    .order('created_at', { ascending: true });

                if (errComp) console.warn('[Auth] Error fetching companions:', errComp.code);
                (companions || []).forEach((p: any) => passengerMap.set(p.id, p));
            }

            // 4. Subir al titular si este usuario es un acompañante
            const parentIds = Array.from(passengerMap.values())
                .map((p: any) => p.parent_passenger_id)
                .filter(Boolean);

            if (parentIds.length > 0) {
                const { data: parents, error: errParent } = await supabase
                    .from('passengers')
                    .select('*')
                    .in('id', parentIds)
                    .is('archived_at', null);

                if (errParent) console.warn('[Auth] Error fetching parents:', errParent.code);
                (parents || []).forEach((p: any) => passengerMap.set(p.id, p));

                const { data: siblings, error: errSiblings } = await supabase
                    .from('passengers')
                    .select('*')
                    .in('parent_passenger_id', parentIds)
                    .is('archived_at', null);

                if (errSiblings) console.warn('[Auth] Error fetching siblings:', errSiblings.code);
                (siblings || []).forEach((p: any) => passengerMap.set(p.id, p));
            }

            // 5. Pasajeros que comparten número de expediente Savia
            const saviaFiles = Array.from(passengerMap.values())
                .map((p: any) => p.savia_file_number?.trim())
                .filter(Boolean);

            if (saviaFiles.length > 0) {
                const { data: fileCompanions, error: errFile } = await supabase
                    .from('passengers')
                    .select('*')
                    .in('savia_file_number', saviaFiles)
                    .is('archived_at', null);

                if (errFile) console.warn('[Auth] Error fetching file companions:', errFile.code);
                (fileCompanions || []).forEach((p: any) => passengerMap.set(p.id, p));
            }

            const allPassengers = Array.from(passengerMap.values());
            setAvailablePassengers(allPassengers);

            if (allPassengers.length === 1) {
                setSelectedPassengerId(allPassengers[0].id);
            } else if (allPassengers.length > 1) {
                setSelectedPassengerId((prev) => {
                    if (prev && allPassengers.some((p: any) => p.id === prev)) {
                        return prev;
                    }
                    return null;
                });
            } else {
                setSelectedPassengerId(null);
            }

        } catch (err) {
            console.error('[Auth] Error fetching passengers:', (err as any)?.code ?? 'unknown');
            setAvailablePassengers([]);
            setSelectedPassengerId(null);
        } finally {
            isFetchingPassengers.current = false;
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
        // Sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);
            if (currentUser) {
                fetchAvailablePassengers(currentUser);
            }
        });

        // Escuchar cambios de auth
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);

            if (event === 'SIGNED_IN') {
                // Reset del guard para permitir re-fetch al cambiar de usuario
                lastFetchedUserId.current = null;
                sessionStorage.removeItem('triex_selected_passenger_id');
                setSelectedPassengerId(null);
            }

            if (event === 'SIGNED_OUT') {
                lastFetchedUserId.current = null;
                isFetchingPassengers.current = false;
            }

            if (currentUser) {
                fetchAvailablePassengers(currentUser);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Cargar rol y estado archivado cuando cambia el usuario.
    // NO llama fetchAvailablePassengers aquí — ya se llama en onAuthStateChange arriba,
    // esto evitaba las 6+ llamadas duplicadas visibles en consola.
    useEffect(() => {
        if (user) {
            refreshRole();
            checkArchivedStatus();

            // Polling cada 60s para detectar si el usuario fue baneado
            const banCheckInterval = setInterval(async () => {
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('banned_until')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (profile?.banned_until) {
                        const bannedUntil = new Date(profile.banned_until);
                        if (bannedUntil > new Date()) {
                            console.log('User has been banned. Forcing logout.');
                            handleBanned();
                        }
                    }
                } catch {
                    // Ignorar errores de red en el polling
                }
            }, 60_000);

            return () => {
                clearInterval(banCheckInterval);
            };
        } else {
            setRole(null);
            setIsArchived(false);
            setAvailablePassengers([]);
            setSelectedPassengerId(null);
        }
    }, [user]);

    const signOut = async () => {
        lastFetchedUserId.current = null;
        isFetchingPassengers.current = false;
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
