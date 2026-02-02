
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LOGO_URL, MOCK_USER, AVATAR_URL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import { usePassenger } from '../hooks/usePassenger';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isStaff } = useRole();
  const { passenger } = usePassenger(); // Use custom hook


  const menuItems = [
    { label: 'Inicio', icon: 'home', path: '/' },
    { label: 'Mi viaje', icon: 'luggage', path: '/mytrip' },
    { label: 'Itinerario', icon: 'calendar_month', path: '/itinerary' },
    { label: 'Documentos', icon: 'description', path: '/vouchers' },
    { label: 'Mis Puntos', icon: 'stars', path: '/points' },
    { label: 'Perfil', icon: 'person', path: '/profile' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
    onClose();
  };

  // Desktop embedded version (no backdrop, no transform)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <>
      {/* Backdrop - Only for mobile */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-zinc-900 z-[70] shadow-2xl transition-transform duration-300 ease-out flex flex-col
          lg:relative lg:translate-x-0 lg:shadow-none lg:w-full lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header inside Sidebar */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <img src={LOGO_URL} alt="Triex" className="h-6" />
          <button onClick={onClose} className="p-2 text-zinc-400 lg:hidden">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* User Profile Mini Section */}
        <div className="p-6 flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
            <img src={AVATAR_URL} alt="Avatar de Camila" className="w-full h-full object-cover" />
          </div>
          <div>
            <div>
              <h3 className="font-bold text-zinc-800 dark:text-white text-sm">
                {passenger ? `${passenger.first_name} ${passenger.last_name}` : 'Cargando...'}
              </h3>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                VIAJERO FRECUENTE {/* Placeholder until points are real */}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors ${isActive ? 'bg-primary/5 text-primary' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'font-fill' : ''}`}>{item.icon}</span>
                <span className="font-bold text-[15px]">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}

          {/* Admin Panel - Only visible to operators and admins */}
          {isStaff && (
            <>
              <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-4 mx-4" />
              <button
                onClick={() => handleNavigate('/admin')}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors ${location.pathname.startsWith('/admin') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                <span className={`material-symbols-outlined ${location.pathname.startsWith('/admin') ? 'font-fill' : ''}`}>admin_panel_settings</span>
                <span className="font-bold text-[15px]">Admin Panel</span>
                {location.pathname.startsWith('/admin') && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </button>
            </>
          )}
        </nav>

        {/* Footer actions */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <button className="w-full flex items-center gap-4 px-4 text-zinc-500 dark:text-zinc-400 font-bold text-sm">
            <span className="material-symbols-outlined">settings</span>
            Ajustes
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 text-red-500 font-bold text-sm"
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};
