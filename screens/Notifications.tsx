
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'HOY',
      items: [
        {
          id: 1,
          title: 'Documento Aprobado',
          description: 'Tu Seguro de Viaje ha sido validado correctamente para tu próximo viaje.',
          time: '10:45 AM',
          icon: 'verified_user',
          iconBg: 'bg-orange-50',
          iconColor: 'text-primary',
          unread: true
        }
      ]
    },
    {
      title: 'AYER',
      items: [
        {
          id: 2,
          title: 'Vouchers Disponibles',
          description: 'Ya podés descargar tus vouchers de hotel y traslados.',
          time: '04:20 PM',
          icon: 'download_for_offline',
          iconBg: 'bg-zinc-100',
          iconColor: 'text-zinc-600',
          unread: false
        }
      ]
    },
    {
      title: 'HACE 3 DÍAS',
      items: [
        {
          id: 3,
          title: 'Recordatorio',
          description: 'No olvides cargar tu Pasaporte para evitar demoras en el check-in.',
          time: 'Lunes, 12 de Junio',
          icon: 'schedule',
          iconBg: 'bg-zinc-100',
          iconColor: 'text-zinc-600',
          unread: false
        },
        {
          id: 4,
          title: '¡Buen viaje!',
          description: 'Tu vuelo AR1304 sale en 48 horas. ¡Prepará tus maletas!',
          time: 'Domingo, 11 de Junio',
          icon: 'flight_takeoff',
          iconBg: 'bg-zinc-100',
          iconColor: 'text-zinc-600',
          unread: false
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-24 lg:pb-8">
      {/* Header Notifications */}
      <div className="px-5 py-6 flex items-center justify-between">
        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
          <img src={LOGO_URL} alt="Triex" className="h-4 brightness-0 opacity-40 dark:brightness-200" />
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
          <span className="material-symbols-outlined text-[28px]">settings</span>
        </button>
      </div>

      <div className="px-5 mb-8">
        <h1 className="text-[34px] font-extrabold text-zinc-800 dark:text-white leading-tight">Notificaciones</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Tenés 1 mensaje sin leer</p>
      </div>

      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title} className="px-5">
            <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.2em] mb-4">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800/50 flex gap-5 relative group active:scale-[0.98] transition-all"
                >
                  <div className={`w-14 h-14 ${item.iconBg} dark:bg-zinc-800 rounded-2xl flex items-center justify-center ${item.iconColor} shrink-0`}>
                    <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                  </div>
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-[16px]">{item.title}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[13px] mt-1 leading-snug">
                      {item.description}
                    </p>
                    <p className="text-zinc-300 dark:text-zinc-600 text-[11px] font-bold mt-3 uppercase tracking-wider">
                      {item.time}
                    </p>
                  </div>
                  {item.unread && (
                    <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-white dark:ring-zinc-900"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Coordinator Contact */}
      <div className="px-5 mt-12">
        <button className="w-full py-5 bg-[#3D3935] dark:bg-zinc-800 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all mb-8">
          <span className="material-symbols-outlined text-2xl">support_agent</span>
          Contactar coordinador
        </button>
      </div>
    </div>
  );
};
