import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleGateProps {
    children: React.ReactNode;
    allowedRoles: string[];
    fallback?: React.ReactNode;
}

/**
 * Component to conditionally render UI based on user role
 * Use this for showing/hiding specific UI elements
 */
export const RoleGate: React.FC<RoleGateProps> = ({
    children,
    allowedRoles,
    fallback = null,
}) => {
    const { role } = useAuth();

    if (!role || !allowedRoles.includes(role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
