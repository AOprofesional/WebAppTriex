
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

const pageTitles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/passengers': 'Pasajeros',
    '/admin/trips': 'Viajes',
    '/admin/vouchers': 'Vouchers & Documentación',
    '/admin/points': 'Puntos',
    '/admin/communications': 'Comunicaciones',
    '/admin/users': 'Usuarios Internos',
    '/admin/settings': 'Configuración',
};

export const AdminLayout: React.FC = () => {
    const location = useLocation();

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
        <div className="min-h-screen bg-[#F5F6FA] dark:bg-zinc-950">
            <AdminSidebar />

            {/* Main Content */}
            <div className="ml-64">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-40">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-800 dark:text-white">{getPageTitle()}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                        </button>
                        <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                            <span className="material-symbols-outlined">help_outline</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
