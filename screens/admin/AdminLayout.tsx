
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { SupportModal } from '../../components/admin/SupportModal';

const pageTitles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/passengers': 'Pasajeros',
    '/admin/trips': 'Viajes',
    '/admin/vouchers': 'Vouchers & Documentación',
    '/admin/points': 'Puntos',
    '/admin/communications': 'Comunicaciones',
    '/admin/surveys': 'Satisfacción',
    '/admin/users': 'Usuarios Internos',
    '/admin/settings': 'Configuración',
};

export const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const getPageTitle = () => {
        // Check for exact match first
        if (pageTitles[location.pathname]) {
            return pageTitles[location.pathname];
        }
        // Check for partial matches (for nested routes)
        for (const [path, title] of Object.entries(pageTitles)) {
            if (path !== '/admin' && location.pathname.startsWith(path)) {
                return title;
            }
        }
        return 'Dashboard';
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] dark:bg-zinc-950 flex">
            {/* Sidebar Overlay (Mobile only) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <AdminSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0 transition-all duration-300 ml-0 md:ml-64 relative">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg md:hidden transition-colors"
                            aria-label="Abrir menú"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-xl font-bold text-zinc-800 dark:text-white truncate">{getPageTitle()}</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => navigate('/admin/communications')}
                            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 relative transition-colors"
                            title="Notificaciones"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                        </button>
                        <button
                            onClick={() => setIsSupportModalOpen(true)}
                            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            title="Ayuda y Soporte"
                        >
                            <span className="material-symbols-outlined">help_outline</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 md:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Global Modals */}
            <SupportModal
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
            />
        </div>
    );
};
