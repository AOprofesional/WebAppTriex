
import React, { useState, useRef, useEffect } from 'react';
import { Status, Activity } from '../types';
import { usePassengerTrips } from '../hooks/usePassengerTrips';
import { useItineraryDays } from '../hooks/useItineraryDays';
import { useItineraryItems } from '../hooks/useItineraryItems';
import { PageLoading } from '../components/PageLoading';
import { ContactCoordinatorModal } from '../components/ContactCoordinatorModal';

export const Itinerary: React.FC = () => {
  const { primaryTrip } = usePassengerTrips();
  const { days, loading: daysLoading } = useItineraryDays(primaryTrip?.id);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { items, loading: itemsLoading } = useItineraryItems(selectedDayId);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const daysContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (days.length > 0 && !selectedDayId) {
      setSelectedDayId(days[0].id);
    }
  }, [days, selectedDayId]);

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
    meetingPoint: item.location_name ? {
      name: item.location_name,
      mapUrl: item.location_detail || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location_name)}`
    } : undefined
  }));

  // Scroll days container logic
  const checkScrollability = () => {
    if (daysContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = daysContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1); // -1 to account for rounding errors
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [days]);

  const scrollDays = (direction: 'left' | 'right') => {
    if (daysContainerRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      daysContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollDayIntoView = (index: number) => {
    if (daysContainerRef.current) {
      const buttons = daysContainerRef.current.querySelectorAll('button');
      if (buttons[index]) {
        buttons[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }

  // Auto-scroll logic (activities)
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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F4F5F9] dark:bg-zinc-950 lg:max-w-4xl lg:mx-auto pb-20">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1F2937] dark:text-white">Tu Itinerario</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Explora tu aventura paso a paso</p>
      </div>

      {days.length > 0 ? (
        <>
          <div className="sticky top-[52px] z-40 bg-[#F4F5F9]/95 dark:bg-zinc-950/95 backdrop-blur-md pt-4 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50 relative">
            {/* Left Scroll Gradient & Button - Hidden on mobile, visible on md+ if can scroll */}
            <div className={`hidden md:flex absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#F4F5F9] dark:from-zinc-950 to-transparent items-center justify-start z-10 pl-2 transition-opacity duration-300 pointer-events-none ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={() => scrollDays('left')}
                className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-zinc-500 hover:text-[#F97316] transition-colors pointer-events-auto active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
            </div>

            <div
              ref={daysContainerRef}
              onScroll={checkScrollability}
              className="flex overflow-x-auto no-scrollbar px-5 gap-3 snap-x snap-mandatory scroll-smooth relative z-0 hide-scrollbar"
            >
              {days.map((day, index) => {
                const isSelected = selectedDayId === day.id;
                const dDate = day.date ? new Date(day.date) : null;
                const dayOfWeek = dDate ? dDate.toLocaleDateString('es-AR', { weekday: 'short' }) : '';
                const dayOfMonth = dDate ? dDate.getDate() : '';

                return (
                  <button
                    key={day.id}
                    onClick={() => {
                      setSelectedDayId(day.id);
                      scrollDayIntoView(index);
                    }}
                    className={`flex-shrink-0 snap-center flex flex-col items-center justify-center min-w-[70px] py-3 px-2 rounded-2xl transition-all ${isSelected ? 'bg-[#F97316] text-white shadow-lg ring-2 ring-[#F97316]/20 scale-105' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800 hover:border-[#F97316]/30 active:scale-95'}`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-white/90' : 'text-zinc-400'}`}>Día {day.day_number}</span>
                    {dDate ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-extrabold leading-none">{dayOfMonth}</span>
                        <span className={`text-[#F4F5F9] text-[10px] mt-0.5 capitalize ${isSelected ? 'text-white/90' : 'text-zinc-500'}`}>{dayOfWeek}</span>
                      </div>
                    ) : (
                      <span className="text-xl font-extrabold leading-none">-</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Gradient & Button - Hidden on mobile, visible on md+ if can scroll */}
            <div className={`hidden md:flex absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#F4F5F9] dark:from-zinc-950 to-transparent items-center justify-end z-10 pr-2 transition-opacity duration-300 pointer-events-none ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={() => scrollDays('right')}
                className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-zinc-500 hover:text-[#F97316] transition-colors pointer-events-auto active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="px-5 mt-8 pb-12">
            {itemsLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]"></div>
              </div>
            ) : activities.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-zinc-200 dark:bg-zinc-800"></div>

                {activities.map((act) => (
                  <div
                    key={act.id}
                    ref={act.status === 'in_course' ? activeItemRef : null}
                    className="relative flex gap-4 md:gap-6 mb-8"
                  >
                    <div className={`z-10 rounded-full p-1 ring-4 shrink-0 h-fit ${act.status === 'approved' ? 'bg-zinc-100 ring-white dark:ring-zinc-950' : act.status === 'in_course' ? 'bg-[#F97316] ring-[#F97316]/20 animate-pulse-subtle' : 'bg-white ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800'}`}>
                      <span className={`material-symbols-outlined text-[24px] ${act.status === 'approved' ? 'text-zinc-400' : act.status === 'in_course' ? 'text-white' : 'text-zinc-400'}`}>
                        {act.icon}
                      </span>
                    </div>


                    <div
                      className={`flex-1 min-w-0 p-4 rounded-xl border transition-all cursor-pointer group ${act.status === 'in_course' ? 'bg-white dark:bg-zinc-900 border-[#F97316] shadow-lg ring-2 ring-[#F97316]/5' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm hover:border-[#F97316]/30 hover:shadow-md'}`}
                      onClick={() => (act.instructions && act.instructions.length > 0) && setSelectedActivity(act)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold uppercase tracking-wider ${act.status === 'in_course' ? 'text-[#F97316]' : 'text-zinc-400'}`}>{act.time}</span>
                          {act.status === 'in_course' && (
                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-[#F97316]/10 text-[#F97316] uppercase tracking-tight w-fit">En curso</span>
                          )}
                        </div>
                        {(act.instructions && act.instructions.length > 0) && (
                          <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-[#F97316]/10 group-hover:text-[#F97316] transition-colors">
                            <span className="material-symbols-outlined text-[20px] text-zinc-300 group-hover:text-[#F97316]">
                              chevron_right
                            </span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-[#1F2937] dark:text-white mt-1 break-words">{act.title}</h4>
                      {act.description && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 break-words">{act.description}</p>}

                      <div className="flex items-start gap-1 mt-3 text-xs font-medium text-zinc-400">
                        <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
                        <span className="break-words flex-1 mt-0.5">{act.location}</span>
                      </div>

                      {(act.instructions && act.instructions.length > 0) && (
                        <div className="mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800 flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-[#F97316] transition-colors">
                          <span>Ver detalles</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </div>
                      )}

                      {/* En curso button override if needed, or keep above logic */}
                      {act.status === 'in_course' && (act.instructions && act.instructions.length > 0) && (
                        <button className="w-full mt-3 bg-[#F97316] text-white py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#E06A2E] transition-colors">
                          Ver instrucciones
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Coordinator Contact */}
                <div className="mt-8 mb-12">
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full py-4 bg-[#3D3935] dark:bg-zinc-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm md:text-base"
                  >
                    <span className="material-symbols-outlined text-xl">support_agent</span>
                    Contactar agente de ventas
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
      )
      }

      {/* Detail Bottom Sheet */}
      {
        selectedActivity && (
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
                    <a
                      href={selectedActivity.meetingPoint.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#F97316] hover:underline"
                    >
                      Ver en Google Maps
                    </a>
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
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full py-4 bg-[#3D3935] text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">support_agent</span>
                  Contactar agente de ventas
                </button>
                <button onClick={() => setSelectedActivity(null)} className="w-full py-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold border border-zinc-200 dark:border-zinc-700">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      }

      <ContactCoordinatorModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        coordinatorPhone={primaryTrip?.coordinator_phone}
        coordinatorEmail={primaryTrip?.coordinator_email}
      />
    </div >
  );
};

export default Itinerary;
