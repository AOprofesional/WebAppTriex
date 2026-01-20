
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Inicio', icon: 'home' },
    { path: '/mytrip', label: 'Mi viaje', icon: 'luggage' },
    { path: '/itinerary', label: 'Itinerario', icon: 'calendar_month' },
    { path: '/vouchers', label: 'Documentos', icon: 'description' },
    { path: '/profile', label: 'Perfil', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 px-2 pb-6 pt-3 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className="flex flex-col items-center gap-1 group flex-1"
            >
              <span 
                className={`material-symbols-outlined transition-all duration-200 text-[26px] ${isActive ? 'text-primary' : 'text-zinc-400 dark:text-zinc-600'}`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-extrabold tracking-tighter text-center ${isActive ? 'text-primary' : 'text-zinc-400 dark:text-zinc-600'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
