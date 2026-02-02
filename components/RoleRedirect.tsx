import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Component to redirect users to appropriate dashboard based on role
 * Passenger -> /home (Home.tsx)
 * Operator/Admin -> /admin (AdminDashboard)
 */
export const RoleRedirect: React.FC = () => {
    const navigate = useNavigate();
    const { user, role, loading, roleLoading } = useAuth();

    useEffect(() => {
        if (loading || roleLoading) return;

        if (!user) {
            navigate('/login');
            return;
        }

        // Redirect based on role
        if (role === 'operator' || role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    }, [user, role, loading, roleLoading, navigate]);

    // Show loading while determining redirect
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
        </div>
    );
};
