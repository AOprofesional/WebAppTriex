
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LOGO_URL } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
    collapsed?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();
    const [vouchersExpanded, setVouchersExpanded] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = [
        { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
        { label: 'Pasajeros', icon: 'group', path: '/admin/passengers' },
        { label: 'Viajes', icon: 'flight_takeoff', path: '/admin/trips' },
        { label: 'Puntos', icon: 'stars', path: '/admin/points' },
        { label: 'Comunicaciones', icon: 'notifications', path: '/admin/communications' },
        { label: 'Usuarios', icon: 'admin_panel_settings', path: '/admin/users' },
        { label: 'Configuración', icon: 'settings', path: '/admin/settings' },
    ];

    const vouchersSubItems = [
        { label: 'Vouchers', icon: 'confirmation_number', path: '/admin/vouchers' },
        { label: 'Documentos', icon: 'description', path: '/admin/documents' },
    ];

    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    const isVouchersActive = vouchersSubItems.some(item => isActive(item.path));

    return (
        <aside className="w-64 h-screen flex flex-col fixed left-0 top-0 z-50" style={{ backgroundColor: '#1a1a1a' }}>
            {/* Logo */}
            <div className="h-20 flex items-center px-6">
                <img src={LOGO_URL} alt="Triex" className="h-10" />
            </div>

            {/* Section Title */}
            <div className="px-6 pb-4">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#757575' }}>Administración</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4">
                <div className="space-y-1">
                    {/* Dashboard, Pasajeros, Viajes */}
                    {menuItems.slice(0, 3).map((item) => {
                        const active = isActive(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                                style={{
                                    backgroundColor: active ? '#E07A2F' : 'transparent',
                                    color: active ? '#ffffff' : '#b0b0b0',
                                }}
                                onMouseEnter={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <span className={`material-symbols-outlined text-xl ${active ? 'font-fill' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        );
                    })}

                    {/* Vouchers & Docs Collapsible Menu */}
                    <div>
                        <button
                            onClick={() => setVouchersExpanded(!vouchersExpanded)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                            style={{
                                backgroundColor: isVouchersActive ? '#E07A2F' : 'transparent',
                                color: isVouchersActive ? '#ffffff' : '#b0b0b0',
                            }}
                            onMouseEnter={(e) => {
                                if (!isVouchersActive) {
                                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isVouchersActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <span className={`material-symbols-outlined text-xl ${isVouchersActive ? 'font-fill' : ''}`}>
                                folder_open
                            </span>
                            <span className="text-sm font-medium flex-1">Vouchers y Docs</span>
                            <span className="material-symbols-outlined text-lg transition-transform" style={{ transform: vouchersExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                expand_more
                            </span>
                        </button>

                        {/* Submenu */}
                        {vouchersExpanded && (
                            <div className="ml-4 mt-1 space-y-1">
                                {vouchersSubItems.map((subItem) => {
                                    const active = isActive(subItem.path);
                                    return (
                                        <button
                                            key={subItem.path}
                                            onClick={() => navigate(subItem.path)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all"
                                            style={{
                                                backgroundColor: active ? 'rgba(224, 122, 47, 0.2)' : 'transparent',
                                                color: active ? '#E07A2F' : '#9a9a9a',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!active) {
                                                    e.currentTarget.style.backgroundColor = '#252525';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!active) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }
                                            }}
                                        >
                                            <span className={`material-symbols-outlined text-lg ${active ? 'font-fill' : ''}`}>
                                                {subItem.icon}
                                            </span>
                                            <span className="text-sm">{subItem.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Rest of menu items: Puntos, Comunicaciones, Usuarios, Configuración */}
                    {menuItems.slice(3).map((item) => {
                        const active = isActive(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                                style={{
                                    backgroundColor: active ? '#E07A2F' : 'transparent',
                                    color: active ? '#ffffff' : '#b0b0b0',
                                }}
                                onMouseEnter={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <span className={`material-symbols-outlined text-xl ${active ? 'font-fill' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4" style={{ borderTop: '1px solid #2a2a2a' }}>
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#2E7D6B', color: '#ffffff' }}>
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">Admin Triex</p>
                        <p className="text-xs" style={{ color: '#757575' }}>admin@triex.com</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 transition-colors hover:bg-zinc-800 rounded-lg"
                        style={{ color: '#757575' }}
                        title="Cerrar sesión"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};
