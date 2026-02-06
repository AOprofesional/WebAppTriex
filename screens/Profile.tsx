
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePassenger } from '../hooks/usePassenger';
import { ProfilePhotoModal } from '../components/ProfilePhotoModal';
import { PageLoading } from '../components/PageLoading';
import { supabase } from '../lib/supabase';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { passenger, loading, uploadAvatar, removeAvatar } = usePassenger();
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleUploadAvatar = async (file: File) => {
    await uploadAvatar(file);
  };

  const handleRemoveAvatar = async () => {
    await removeAvatar();
  };

  // Get initials from name
  const getInitials = () => {
    if (!passenger) return '?';
    const firstInitial = passenger.first_name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = passenger.last_name?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || '?';
  };

  if (loading) {
    return <PageLoading message="Cargando perfil..." />;
  }

  if (!passenger) {
    return (
      <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">No se pudo cargar la información del perfil</p>
      </div>
    );
  }

  const memberSince = new Date(passenger.created_at).getFullYear();

  return (
    <div className="px-5 pt-10 pb-12 max-w-md mx-auto flex flex-col items-center min-h-screen bg-triex-bg dark:bg-zinc-950 lg:max-w-2xl lg:pt-8">
      {/* Avatar Section */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-md overflow-hidden">
          {passenger.avatar_url ? (
            <img src={passenger.avatar_url} alt={`Foto de ${passenger.first_name}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-3xl font-bold">
              {getInitials()}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowPhotoModal(true)}
          className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-zinc-900"
        >
          <span className="material-symbols-outlined text-sm font-bold">edit</span>
        </button>
      </div>

      {/* User Info */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-triex-grey dark:text-white font-ubuntu">
          {passenger.first_name} {passenger.last_name}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-1">
          Miembro desde {memberSince}
        </p>
      </div>

      {/* Ver Puntos Action (Mockup) */}
      <button
        onClick={() => navigate('/points')}
        className="w-full mb-8 py-4 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all relative group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined font-fill">stars</span>
          </div>
          <div className="text-left">
            <p className="text-[13px] font-bold text-triex-grey dark:text-white uppercase tracking-tight">Ver mis puntos</p>
            <p className="text-[11px] text-zinc-400 font-bold">Próximamente</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600">chevron_right</span>
      </button>

      {/* Settings List */}
      <div className="w-full space-y-4 mb-8">
        <div className="flex items-center px-1">
          <h3 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Configuración</h3>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-50 dark:border-zinc-800/50">
            <div className="flex items-center">
              <div className="w-11 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mr-4 text-zinc-400 group">
                <span className={`material-symbols-outlined transition-colors ${isDarkMode ? 'text-primary' : ''}`}>
                  {isDarkMode ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
              <p className="font-bold text-triex-grey dark:text-zinc-200">Modo Noche</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${isDarkMode ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isDarkMode ? 'translate-x-6 shadow-md' : ''}`}></div>
            </button>
          </div>

          {/* Navigation Items */}
          {[
            { label: 'Información Personal', icon: 'person_outline', path: '/edit-personal-info' },
            { label: 'Seguridad y Privacidad', icon: 'lock_outline', path: '/security-settings' },
            { label: 'Notificaciones', icon: 'notifications_none', path: '/notification-settings' }
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => navigate(item.path)}
              className={`flex items-center p-5 cursor-pointer active:bg-zinc-50 dark:active:bg-zinc-800/50 transition-colors ${i < 2 ? 'border-b border-zinc-50 dark:border-zinc-800/50' : ''}`}
            >
              <div className="w-11 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mr-4 text-zinc-400">
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <p className="flex-1 font-bold text-triex-grey dark:text-zinc-200">{item.label}</p>
              <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-700">chevron_right</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coordinator Contact */}
      <button className="w-full py-5 bg-[#3D3935] dark:bg-zinc-800 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all mb-6">
        <span className="material-symbols-outlined text-2xl">support_agent</span>
        Contactar coordinador
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined">logout</span>
        <span>Cerrar sesión</span>
      </button>

      {/* Profile Photo Modal */}
      <ProfilePhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        currentPhotoUrl={passenger.avatar_url}
        onUpload={handleUploadAvatar}
        onRemove={passenger.avatar_url ? handleRemoveAvatar : undefined}
      />
    </div>
  );
};
