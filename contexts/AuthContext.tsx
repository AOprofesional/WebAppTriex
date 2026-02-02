import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: string | null;
    roleLoading: boolean;
    isArchived: boolean;
    signOut: () => Promise<void>;
    refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const [isArchived, setIsArchived] = useState(false);

    // Function to fetch and update role
    const refreshRole = async () => {
        setRoleLoading(true);
        if (!user) {
            setRole(null);
            setRoleLoading(false);
            return;
        }

        const { data, error } = await supabase.rpc('get_my_role');

        if (error) {
            console.error('Error getting user role:', error);
            setRole(null);
        } else {
            setRole(data);
        }
        setRoleLoading(false);
    };

    // Function to check if passenger is archived
    const checkArchivedStatus = async () => {
        if (!user) {
            setIsArchived(false);
            return;
        }

        const { data, error } = await supabase.rpc('is_passenger_archived');

        if (error) {
            console.error('Error checking archived status:', error);
            setIsArchived(false);
            return;
        }

        setIsArchived(data === true);
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
        refreshRole();
        checkArchivedStatus();
    }, [user]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
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
