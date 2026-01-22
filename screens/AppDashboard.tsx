import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AppDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, getRole, signOut } = useAuth();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If not authenticated, redirect to login
        if (!user) {
            navigate('/login');
            return;
        }

        // Get user role
        const fetchRole = async () => {
            const userRole = await getRole();
            setRole(userRole);
            setLoading(false);
        };

        fetchRole();
    }, [user, navigate, getRole]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-triex-bg">
                <div className="text-center">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                    <p className="mt-4 text-triex-grey font-ubuntu">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-triex-bg">
            {/* Header */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">travel_explore</span>
                            <h1 className="font-ubuntu font-bold text-xl text-triex-grey">Triex App</h1>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-ubuntu font-bold text-triex-grey hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-3xl">person</span>
                        </div>
                        <div>
                            <h2 className="font-ubuntu font-bold text-2xl text-triex-grey">
                                ¡Bienvenido a Triex!
                            </h2>
                            <p className="text-zinc-500">
                                {user?.email}
                            </p>
                        </div>
                    </div>

                    {/* Role Badge */}
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg">
                        <span className="material-symbols-outlined text-sm">badge</span>
                        <span className="font-ubuntu font-bold text-sm capitalize">
                            Role: {role || 'Cargando...'}
                        </span>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600">airplane_ticket</span>
                            </div>
                            <span className="text-2xl font-ubuntu font-bold text-triex-grey">0</span>
                        </div>
                        <h3 className="font-ubuntu font-bold text-lg text-triex-grey mb-1">Viajes</h3>
                        <p className="text-sm text-zinc-500">Próximos viajes programados</p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600">description</span>
                            </div>
                            <span className="text-2xl font-ubuntu font-bold text-triex-grey">0</span>
                        </div>
                        <h3 className="font-ubuntu font-bold text-lg text-triex-grey mb-1">Documentos</h3>
                        <p className="text-sm text-zinc-500">Vouchers y comprobantes</p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-600">stars</span>
                            </div>
                            <span className="text-2xl font-ubuntu font-bold text-triex-grey">0</span>
                        </div>
                        <h3 className="font-ubuntu font-bold text-lg text-triex-grey mb-1">Puntos</h3>
                        <p className="text-sm text-zinc-500">Puntos acumulados</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 mt-6">
                    <h3 className="font-ubuntu font-bold text-lg text-triex-grey mb-4">Acciones rápidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-zinc-200 hover:border-primary hover:bg-primary/5 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary">home</span>
                            <span className="font-ubuntu font-bold text-sm text-triex-grey">Ir a Inicio</span>
                        </button>
                        <button
                            onClick={() => navigate('/mytrip')}
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-zinc-200 hover:border-primary hover:bg-primary/5 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary">luggage</span>
                            <span className="font-ubuntu font-bold text-sm text-triex-grey">Mi Viaje</span>
                        </button>
                        <button
                            onClick={() => navigate('/vouchers')}
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-zinc-200 hover:border-primary hover:bg-primary/5 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary">description</span>
                            <span className="font-ubuntu font-bold text-sm text-triex-grey">Documentos</span>
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-zinc-200 hover:border-primary hover:bg-primary/5 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary">person</span>
                            <span className="font-ubuntu font-bold text-sm text-triex-grey">Mi Perfil</span>
                        </button>
                    </div>
                </div>

                {/* Auth Info for Testing */}
                <div className="bg-zinc-100 rounded-2xl p-6 mt-6">
                    <h3 className="font-ubuntu font-bold text-sm text-zinc-600 mb-3">Información de autenticación (solo MVP)</h3>
                    <div className="space-y-2 text-sm font-mono text-zinc-600">
                        <p><strong>User ID:</strong> {user?.id}</p>
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Role:</strong> {role}</p>
                        <p><strong>Created:</strong> {user?.created_at}</p>
                    </div>
                </div>
            </main>
        </div>
    );
};
