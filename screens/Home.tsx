
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_USER, AVATAR_URL } from '../constants';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5 py-6 space-y-8 max-w-md mx-auto min-h-screen bg-triex-bg dark:bg-zinc-950 pb-12 lg:max-w-none lg:px-8 lg:py-8">
      {/* Saludo */}
      <section className="pt-2">
        <h1 className="text-[30px] font-extrabold tracking-tight text-triex-grey dark:text-white leading-tight">
          Hola, {MOCK_USER.name.split(' ')[0]} 👋
        </h1>
        <p className="text-[#7E8CA0] dark:text-zinc-400 text-[16px] font-medium mt-1">
          ¡Qué bueno volver a verte!
        </p>
      </section>

      {/* Desktop: First row grid */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Sección: Próximo Viaje */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[18px] font-extrabold text-triex-grey dark:text-white">Próximo viaje</h2>
            <span className="text-zinc-600 dark:text-zinc-300 text-[12px] font-bold px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              Confirmado
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-sm border border-zinc-100 dark:border-zinc-800 p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <h3 className="text-[22px] font-extrabold text-triex-grey dark:text-white">Viaje a Bariloche</h3>
                <div className="flex items-center text-zinc-400 text-[14px] gap-2">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  <span className="font-semibold tracking-tight">15 Oct - 22 Oct, 2024</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-[#F0F2F5] dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-triex-grey dark:text-zinc-300">
                <span className="material-symbols-outlined text-[26px] font-fill">mountain_flag</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-3 overflow-hidden">
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900" src="https://i.pravatar.cc/100?u=1" alt="" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900" src="https://i.pravatar.cc/100?u=2" alt="" />
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2D333D] text-[11px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                  +2
                </div>
              </div>
              <span className="text-[13px] text-zinc-400 font-semibold">Vas con 3 personas más</span>
            </div>

            <button
              onClick={() => navigate('/mytrip')}
              className="w-full mt-8 bg-[#3D3935] hover:bg-black/90 text-white py-[18px] rounded-[20px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm text-[16px]"
            >
              Ver detalles del viaje
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Sección: Tu Próximo Paso */}
        <section>
          <h2 className="text-[18px] font-extrabold text-triex-grey dark:text-white mb-4 px-1">Tu próximo paso</h2>
          <div className="bg-[#3D3935] dark:bg-zinc-900 rounded-[32px] p-7 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[32px]">description</span>
              </div>
              <div>
                <h3 className="text-[19px] font-bold">Cargar documentación</h3>
              </div>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="w-full py-[18px] bg-[#E0592A] hover:bg-[#F06A3B] text-white rounded-[20px] font-bold shadow-lg shadow-black/20 transition-all active:scale-[0.98] text-[17px] tracking-tight"
            >
              Realizar ahora
            </button>
          </div>
        </section>
      </div>

      {/* Desktop: Second row grid */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Sección: Avisos Importantes */}
        <section>
          <h2 className="text-[18px] font-extrabold text-triex-grey dark:text-white mb-4 px-1">Avisos importantes</h2>
          <div
            onClick={() => navigate('/vouchers')}
            className="group bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-5 flex-1">
              <div className="w-14 h-14 bg-[#F0F5FA] dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-triex-grey dark:text-zinc-300">
                <span className="material-symbols-outlined text-[28px]">confirmation_number</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-triex-grey dark:text-white text-[16px] leading-tight">Tus vouchers ya están disponibles</h3>
                <p className="text-[13px] text-zinc-400 mt-1.5 leading-snug font-medium">Podés descargarlos desde la sección de mis viajes.</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 transition-transform group-hover:translate-x-1">chevron_right</span>
          </div>
        </section>

        {/* Sección: Tus Puntos */}
        <section className="mt-6 lg:mt-0 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[32px] p-7 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
          <div>
            <p className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">Tus puntos</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-black text-triex-grey dark:text-white leading-none">1.250</span>
              <span className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded tracking-tighter">PTS</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/points')}
            className="px-7 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[18px] font-extrabold text-[14px] text-triex-grey dark:text-white shadow-sm active:scale-95 transition-all"
          >
            Ver puntos
          </button>
        </section>
      </div>

    </div>
  );
};
