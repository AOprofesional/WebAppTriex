
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();

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
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-zinc-900"></span>
          </div>
        </div>
      </div>
    </header>
  );
};
