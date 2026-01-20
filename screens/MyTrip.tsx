
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';

export const MyTrip: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-20 lg:pb-8">
      {/* Custom Header for My Trip - Hidden on desktop */}
      <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-zinc-950 sticky top-0 z-50 lg:hidden">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-zinc-800 dark:text-zinc-200">
          <span className="material-symbols-outlined text-[28px]">chevron_left</span>
        </button>
        <h1 className="text-lg font-bold text-zinc-800 dark:text-white">Mi viaje</h1>
        <div className="w-16 flex justify-end">
          <img src={LOGO_URL} alt="Triex" className="h-4 object-contain brightness-0 dark:brightness-200 opacity-80" />
        </div>
      </div>

      <div className="px-5 pt-4 space-y-6">
        {/* Main Trip Card */}
        <div className="bg-[#3D3935] dark:bg-zinc-900 rounded-[40px] overflow-hidden shadow-xl">
          <div className="relative h-48">
            <img
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800"
              alt="Bariloche"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <span className="bg-white/90 backdrop-blur-sm text-[#00A86B] text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
                Confirmado
              </span>
            </div>
          </div>
          <div className="p-8 space-y-6 text-white">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">Destino</p>
              <h2 className="text-2xl font-bold">Bariloche, Argentina</h2>
            </div>

            <div className="grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Fechas</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                  <span className="text-[15px] font-bold">15 Jul - 22 Jul</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Tipo</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">school</span>
                  <span className="text-[15px] font-bold">Egresados</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Estado</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl font-fill">check_circle</span>
                  <span className="text-[15px] font-bold">Pagado</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Pasajeros</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl font-fill">person</span>
                  <span className="text-[15px] font-bold">1 Adulto</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Step Section */}
        <section>
          <h3 className="text-[17px] font-extrabold text-zinc-800 dark:text-white mb-4">Próximo paso</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-5">
            <div className="w-14 h-14 bg-zinc-800 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-3xl font-fill">description</span>
            </div>
            <div>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-[16px]">Ficha Médica</h4>
              <p className="text-zinc-400 text-[12px] mt-1 leading-snug">
                Completa los datos obligatorios de salud antes de tu salida.
              </p>
              <button className="text-primary font-bold text-[13px] mt-3 flex items-center gap-1">
                Completar ahora
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* Itinerary Summary Section */}
        <section>
          <h3 className="text-[17px] font-extrabold text-zinc-800 dark:text-white mb-4">Tu Itinerario</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl font-fill">event_upcoming</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Próxima actividad</p>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-[16px]">Cena de Bienvenida</h4>
                </div>
              </div>
              <span className="bg-primary/5 text-primary text-[11px] font-bold px-3 py-1.5 rounded-lg">
                20:00 hs
              </span>
            </div>
            <button
              onClick={() => navigate('/itinerary')}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Ver itinerario completo
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Coordinator Contact */}
        <button className="w-full py-5 bg-[#3D3935] dark:bg-zinc-800 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
          <span className="material-symbols-outlined text-2xl">support_agent</span>
          Contactar coordinador
        </button>
      </div>
    </div>
  );
};
