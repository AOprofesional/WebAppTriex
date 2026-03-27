
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LOGO_URL } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AdminSidebarProps {
    collapsed?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed = false, isOpen = false, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, role, user } = useAuth();
    const [vouchersExpanded, setVouchersExpanded] = useState(false);
    const [profileName, setProfileName] = useState<string>('Usuario');
    const isOperator = role === 'operator';

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                // Primero intentar desde user_metadata por si fue registrado con Google
                if (user.user_metadata?.full_name) {
                    setProfileName(user.user_metadata.full_name);
                } else if (user.user_metadata?.name) {
                    setProfileName(user.user_metadata.name);
                }

                // Luego intentar desde la tabla perfiles para asegurar el último nombre
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                
                if (!error && data?.full_name) {
                    setProfileName(data.full_name);
                }
            } catch (err) {
                console.error('Error fetching profile name:', err);
            }
        };

        fetchProfile();
    }, [user]);

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

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
        { label: 'Satisfacción', icon: 'sentiment_satisfied', path: '/admin/surveys' },
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
        <aside 
            className={`w-64 h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
            style={{ backgroundColor: '#1a1a1a' }}
        >
            {/* Logo */}
            <div className="h-20 flex items-center justify-between px-6">
                <img src={LOGO_URL} alt="Triex" className="h-10" />
                <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white p-2 -mr-2 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Section Title */}
            <div className="px-6 pb-4">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#757575' }}>Administración</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#333] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#444]">
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

                    {/* Puntos, Comunicaciones */}
                    {menuItems.slice(3, 5).map((item) => {
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

                    {/* Divider */}
                    <div className="my-2 mx-4 border-t" style={{ borderColor: '#2a2a2a' }}></div>

                    {/* Usuarios (solo admin/superadmin), Configuración */}
                    {menuItems.slice(5).filter(item => !(item.path === '/admin/users' && isOperator)).map((item) => {
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
                        {getInitials(profileName)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{profileName}</p>
                        <p className="text-xs truncate" style={{ color: '#757575' }}>{user?.email || 'usuario@triex.com'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 transition-colors hover:bg-zinc-800 rounded-lg shrink-0"
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
