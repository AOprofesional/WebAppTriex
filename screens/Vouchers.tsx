
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AVATAR_URL } from '../constants';

export const Vouchers: React.FC = () => {
  const navigate = useNavigate();

  const documents = [
    { id: '1', name: 'Pasaporte', status: 'APROBADO', icon: 'badge', state: 'approved' },
    { id: '2', name: 'Visa', status: 'PENDIENTE', icon: 'description', state: 'pending' },
    { id: '3', name: 'Seguro de Viaje', status: 'APROBADO', icon: 'health_and_safety', state: 'approved' },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-zinc-950 pb-32 lg:pb-8">
      {/* Top Navigation - Hidden on desktop */}
      <div className="px-5 py-4 flex items-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-50 lg:hidden">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-zinc-500 dark:text-zinc-400">
          <span className="material-symbols-outlined text-[28px]">chevron_left</span>
        </button>
        <div className="flex-1 flex justify-center -ml-8">
          <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border border-white dark:border-zinc-700 shadow-sm">
            <img src={AVATAR_URL} alt="Avatar de Camila" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#2D333D] dark:text-white mb-8">
          Vouchers y documentación
        </h1>

        {/* Vouchers Section */}
        <section className="mb-8">
          <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 px-1">
            Vouchers
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#F0F2F5] dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-2xl font-fill">hotel</span>
              </div>
              <div>
                <h3 className="font-bold text-[#2D333D] dark:text-zinc-100 text-[16px]">Hotel Hilton</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-zinc-400 text-sm font-fill">check_circle</span>
                  <span className="text-[13px] font-medium text-zinc-400">Disponible</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-[14px] font-bold text-zinc-500 dark:text-zinc-400 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[20px] font-fill">visibility</span>
                Ver
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-[14px] font-bold text-zinc-500 dark:text-zinc-400 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Descargar
              </button>
            </div>
          </div>
        </section>

        {/* Documentation Section */}
        <section>
          <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 px-1">
            Documentación
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800/50">
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                className={`flex items-center justify-between p-5 ${idx !== documents.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[18px] bg-[#F0F2F5] dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined text-2xl">{doc.icon}</span>
                  </div>
                  <p className="font-bold text-[#2D333D] dark:text-zinc-100 text-[15px]">{doc.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${doc.state === 'approved' ? 'text-zinc-400 dark:text-zinc-500' : 'text-primary'}`}>
                    {doc.status}
                  </span>
                  {doc.state === 'approved' ? (
                    <div className="w-6 h-6 rounded-full bg-[#A5ABB5] dark:bg-zinc-700 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px] animate-pulse">more_horiz</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coordinator Contact */}
        <div className="mt-8 px-2">
          <button className="w-full py-5 bg-[#3D3935] dark:bg-zinc-800 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
            <span className="material-symbols-outlined text-2xl">support_agent</span>
            Contactar coordinador
          </button>
        </div>

        <p className="mt-8 text-[12px] text-zinc-400 italic leading-relaxed px-2">
          * Por favor asegúrese de completar los documentos pendientes antes de su fecha de viaje.
        </p>
      </div>

      {/* Footer Action Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 z-40 pointer-events-none">
        <button className="w-full max-w-md mx-auto pointer-events-auto py-5 bg-primary text-white rounded-[24px] font-bold shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-base">
          <span className="material-symbols-outlined text-2xl">download</span>
          Descargar todo (.zip)
        </button>
      </div>

      {/* Dark mode toggle helper */}
      <div className="fixed bottom-40 right-6 z-[100]">
        <button
          onClick={() => document.documentElement.classList.toggle('dark')}
          className="w-12 h-12 bg-[#2D333D] dark:bg-white text-white dark:text-triex-grey rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white dark:border-zinc-950"
        >
          <span className="material-symbols-outlined text-xl">dark_mode</span>
        </button>
      </div>
    </div>
  );
};
