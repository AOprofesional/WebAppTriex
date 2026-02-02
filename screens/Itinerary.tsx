
import React, { useState, useRef, useEffect } from 'react';
import { Status, Activity } from '../types';
import { usePassengerTrips } from '../hooks/usePassengerTrips';
import { useItineraryDays } from '../hooks/useItineraryDays';
import { useItineraryItems } from '../hooks/useItineraryItems';
import { PageLoading } from '../components/PageLoading';

export const Itinerary: React.FC = () => {
  const { primaryTrip } = usePassengerTrips();
  const { days, loading: daysLoading } = useItineraryDays(primaryTrip?.id);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const { items, loading: itemsLoading } = useItineraryItems(selectedDayId);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (days.length > 0 && !selectedDayId) {
      setSelectedDayId(days[0].id);
    }
  }, [days]);

  // Map items to Activity type
  const activities: Activity[] = items.map(item => ({
    id: item.id,
    time: item.time?.slice(0, 5) || '', // HH:MM
    title: item.title,
    description: item.description || '',
    location: item.location_name || '',
    status: 'approved', // Logic to determine status could be added here
    icon: 'location_on', // Default icon
    instructions: item.instructions_text ? [item.instructions_text] : [],
  }));

  // Auto-scroll logic (kept from original)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeItemRef.current) {
        activeItemRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedDayId]);

  if (daysLoading && days.length === 0) {
    return <PageLoading message="Cargando itinerario..." />;
  }

  return (
    <div className="min-h-screen bg-[#F4F5F9] dark:bg-zinc-950 lg:max-w-4xl lg:mx-auto pb-20">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1F2937] dark:text-white">Tu Itinerario</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Explora tu aventura paso a paso</p>
      </div>

      {days.length > 0 ? (
        <>
          <div className="sticky top-[52px] z-40 bg-[#F4F5F9]/95 dark:bg-zinc-950/95 backdrop-blur-sm pt-2 pb-4">
            <div className="flex overflow-x-auto no-scrollbar px-5 gap-3">
              {days.map(day => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`flex-shrink-0 px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${selectedDayId === day.id ? 'bg-[#F97316] text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800'}`}
                >
                  Día {day.day_number}
                  {day.date && <span className="ml-1 opacity-75 font-normal">| {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 mt-4 pb-12">
            {itemsLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]"></div>
              </div>
            ) : activities.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-zinc-200 dark:bg-zinc-800"></div>

                {activities.map((act) => (
                  <div
                    key={act.id}
                    ref={act.status === 'in_course' ? activeItemRef : null}
                    className="relative flex gap-6 mb-8"
                  >
                    <div className={`z-10 rounded-full p-1 ring-4 h-fit ${act.status === 'approved' ? 'bg-zinc-100 ring-white dark:ring-zinc-950' : act.status === 'in_course' ? 'bg-[#F97316] ring-[#F97316]/20 animate-pulse-subtle' : 'bg-white ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800'}`}>
                      <span className={`material-symbols-outlined text-[24px] ${act.status === 'approved' ? 'text-zinc-400' : act.status === 'in_course' ? 'text-white' : 'text-zinc-400'}`}>
                        {act.icon}
                      </span>
                    </div>

                    <div
                      className={`flex-1 p-4 rounded-xl border transition-all cursor-pointer ${act.status === 'in_course' ? 'bg-white dark:bg-zinc-900 border-[#F97316] shadow-lg ring-2 ring-[#F97316]/5' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm opacity-90'}`}
                      onClick={() => (act.instructions && act.instructions.length > 0) && setSelectedActivity(act)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold uppercase tracking-wider ${act.status === 'in_course' ? 'text-[#F97316]' : 'text-zinc-400'}`}>{act.time}</span>
                          {act.status === 'in_course' && (
                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-[#F97316]/10 text-[#F97316] uppercase tracking-tight w-fit">En curso</span>
                          )}
                        </div>
                        {(act.instructions && act.instructions.length > 0) && (
                          <span className={`material-symbols-outlined text-lg ${act.status === 'in_course' ? 'text-[#F97316]' : 'text-zinc-300'}`}>
                            more_horiz
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-[#1F2937] dark:text-white">{act.title}</h4>
                      {act.description && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{act.description}</p>}
                      <div className="flex items-center gap-1 mt-3 text-xs font-medium text-zinc-400">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span>{act.location}</span>
                      </div>
                      {act.status === 'in_course' && (act.instructions && act.instructions.length > 0) && (
                        <button className="w-full mt-4 bg-[#F97316] text-white py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                          Ver instrucciones
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Coordinator Contact */}
                <div className="mt-8 mb-12 ml-14">
                  <button className="w-full py-5 bg-[#3D3935] dark:bg-zinc-800 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-2xl">support_agent</span>
                    Contactar coordinador
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-400">
                <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                <p>No hay actividades programadas para este día.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 px-5">
          <span className="material-symbols-outlined text-5xl text-zinc-300 mb-4">map</span>
          <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">Itinerario no disponible</h3>
          <p className="text-zinc-500 mt-2">No se han encontrado días o actividades cargadas para tu viaje aún.</p>
        </div>
      )}

      {/* Detail Bottom Sheet */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-0">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setSelectedActivity(null)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-2xl p-6 pt-3 animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
            </div>

            <button onClick={() => setSelectedActivity(null)} className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white font-ubuntu">{selectedActivity.title}</h2>
              <div className="flex items-center gap-2 mt-2 text-[#F97316]">
                <span className="material-symbols-outlined text-sm font-fill">schedule</span>
                <span className="text-sm font-bold">Día {days.find(d => d.id === selectedDayId)?.day_number}, {selectedActivity.time}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-3">¿Qué debo hacer?</h3>
              <ul className="space-y-3">
                {selectedActivity.instructions?.map((inst, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#F97316] text-lg">check_circle</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{inst}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedActivity.meetingPoint && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-[#1F2937] dark:text-white">Punto de encuentro</h3>
                  <span className="text-xs font-bold text-[#F97316]">Ver en Google Maps</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 relative h-44">
                  <img alt="Meeting point map" className="w-full h-full object-cover" src={selectedActivity.meetingPoint.mapUrl} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-[#F97316] p-2 rounded-full shadow-lg text-white">
                      <span className="material-symbols-outlined font-fill">location_on</span>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-zinc-800/95 p-3 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#1F2937] dark:text-zinc-300">
                      <span className="material-symbols-outlined text-zinc-400 text-sm">apartment</span>
                      <span>{selectedActivity.meetingPoint.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pb-8">
              <button className="w-full py-4 bg-[#3D3935] text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">support_agent</span>
                Contactar coordinador
              </button>
              <button onClick={() => setSelectedActivity(null)} className="w-full py-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold border border-zinc-200 dark:border-zinc-700">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
