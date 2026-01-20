
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_USER, AVATAR_URL } from '../constants';

export const Points: React.FC = () => {
  const navigate = useNavigate();

  const movements = [
    { id: 1, title: 'Viaje a Bariloche', subtitle: '12 Oct 2023 • ID: 8291', pts: '+800', type: 'MILLAS', icon: 'flight_takeoff', positive: true },
    { id: 2, title: 'Evento Anual TrieX', subtitle: '05 Oct 2023 • Presencial', pts: '+300', type: 'MILLAS', icon: 'confirmation_number', positive: true },
    { id: 3, title: 'Referido confirmado', subtitle: '28 Sep 2023 • Invitación', pts: '+150', type: 'MILLAS', icon: 'card_giftcard', positive: true },
    { id: 4, title: 'Canje Gift Card', subtitle: '15 Sep 2023 • E-shop', pts: '-200', type: 'MILLAS', icon: 'shopping_cart', positive: false },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20 lg:pb-8">
      {/* Top Navigation Bar - Hidden on desktop */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-50 dark:border-zinc-900 bg-white dark:bg-zinc-950 sticky top-0 z-50 lg:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-zinc-500 dark:text-zinc-400">
            <span className="material-symbols-outlined text-[28px]">chevron_left</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <img src={AVATAR_URL} alt="Avatar de Camila" className="w-full h-full object-cover" />
          </div>
        </div>
        <span className="text-[11px] font-extrabold text-[#7E8CA0] dark:text-zinc-500 uppercase tracking-widest">Mis Puntos</span>
      </div>

      <div className="px-5 pt-6">
        {/* Main Balance Card */}
        <div className="bg-[#2D333D] dark:bg-zinc-900 rounded-[42px] pt-12 pb-10 px-6 shadow-2xl text-center flex flex-col items-center">
          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.25em] mb-4">Saldo Disponible</span>
          <div className="flex items-baseline gap-2 mb-10">
            <span className="text-7xl font-extrabold text-white tracking-tighter">1.250</span>
            <span className="text-xl font-medium text-zinc-400">pts</span>
          </div>
          <div className="flex gap-4 w-full">
            <button className="flex-1 bg-primary text-white py-4 rounded-2xl text-[15px] font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">
              Canjear
            </button>
            <button className="flex-1 bg-[#3F4753] dark:bg-zinc-800/50 text-white py-4 rounded-2xl text-[15px] font-bold active:scale-95 transition-all border border-white/5">
              Historial
            </button>
          </div>
        </div>

        {/* Recent Movements Section */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-[18px] font-extrabold text-triex-grey dark:text-white">Movimientos recientes</h2>
            <button className="text-primary text-sm font-bold active:opacity-70">Ver todos</button>
          </div>
          <div className="space-y-4">
            {movements.map((move) => (
              <div key={move.id} className="bg-white dark:bg-zinc-900 p-4 rounded-[24px] flex items-center justify-between shadow-sm border border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[18px] bg-[#F0F2F5] dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined text-2xl">{move.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-triex-grey dark:text-zinc-100 text-[15px] leading-tight">{move.title}</p>
                    <p className="text-[11px] font-medium text-zinc-400 mt-1 tracking-tight">{move.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-[15px] ${move.positive ? 'text-triex-grey dark:text-white' : 'text-zinc-400'}`}>
                    {move.pts}
                  </p>
                  <p className={`text-[9px] font-black tracking-wider mt-0.5 ${move.positive ? 'text-primary' : 'text-zinc-500'}`}>
                    {move.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coordinator Contact */}
        <div className="mt-12 mb-8">
          <button className="w-full py-5 bg-[#3D3935] dark:bg-zinc-800 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
            <span className="material-symbols-outlined text-2xl">support_agent</span>
            Contactar coordinador
          </button>
        </div>
      </div>

      {/* Floating Dark Mode Toggle */}
      <div className="fixed bottom-24 right-6 z-[100]">
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
