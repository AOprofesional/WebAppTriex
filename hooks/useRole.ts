import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for easy role access and role-based checks
 */
export const useRole = () => {
    const { role } = useAuth();

    return {
        role,
        isPassenger: role === 'passenger',
        isOperator: role === 'operator',
        isAdmin: role === 'admin',
        isStaff: role === 'operator' || role === 'admin',
        canAccessAdmin: role === 'operator' || role === 'admin',
    };
};
