
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { useNotifications } from '../hooks/useNotifications';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="w-12">
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center p-1 rounded-lg active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined text-triex-grey dark:text-zinc-300">menu</span>
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <img alt="Triex Logo" className="h-7 object-contain cursor-pointer" src={LOGO_URL} onClick={() => navigate('/')} />
        </div>
        <div className="w-12 flex justify-end">
          <div
            className="relative cursor-pointer active:scale-90 transition-transform"
            onClick={() => navigate('/notifications')}
          >
            <span className="material-symbols-outlined text-triex-grey dark:text-zinc-300">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
