
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-between px-8 pt-20 pb-12 min-h-screen bg-white max-w-md mx-auto lg:max-w-xl lg:pt-32">
      {/* Logo Container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-full flex items-center justify-center mb-16">
          <img
            alt="Triex Logo"
            className="w-48 object-contain"
            src={LOGO_URL}
          />
        </div>

        <div className="w-full text-center space-y-3">
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#2D333D] font-sans leading-tight">
            Bienvenido a tu viaje
          </h1>
          <p className="text-[#7E8CA0] text-[17px] font-medium leading-relaxed px-2">
            Accedé a toda la información de tu viaje de forma simple y segura.
          </p>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="w-full space-y-4 mt-8">
        <button
          onClick={() => navigate('/')}
          className="w-full py-5 px-6 bg-[#E0592A] text-white font-bold rounded-[20px] shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group text-lg"
        >
          <span>Ingresar</span>
          <span className="material-symbols-outlined font-bold text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>

        <button className="w-full py-5 px-6 bg-[#3D3935] text-white font-bold rounded-[20px] shadow-xl shadow-zinc-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg">
          <span>Crear cuenta</span>
          <span className="material-symbols-outlined font-bold text-xl">person_add</span>
        </button>

        <div className="pt-10 text-center">
          <button className="text-[14px] text-[#A5ABB5] font-semibold hover:text-zinc-600 transition-colors">
            ¿Necesitás ayuda? Contactanos
          </button>
        </div>
      </div>
    </div>
  );
};
