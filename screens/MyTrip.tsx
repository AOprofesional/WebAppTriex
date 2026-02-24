import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL, DEFAULT_TRIP_IMAGE } from '../constants';
import { useTripDetails } from '../hooks/useTripDetails';
import { TripStatusBadge } from '../components/TripStatusBadge';
import { PageLoading } from '../components/PageLoading';
import { useNextActivity } from '../hooks/useNextActivity';

export const MyTrip: React.FC = () => {
  const navigate = useNavigate();
  const { trip, vouchers, documentRequirements, loading } = useTripDetails();
  // Safe optional chaining for nextActivity hook
  const { nextActivity } = useNextActivity(trip?.id);
  const [openingVoucher, setOpeningVoucher] = useState<string | null>(null);

  // Format date range with validation
  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 'Por confirmar';

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Fecha por confirmar';
    }

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString('es-AR', { month: 'short' });
    const endMonth = end.toLocaleDateString('es-AR', { month: 'short' });

    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  };

  const handleVoucherClick = async (voucher: any) => {
    setOpeningVoucher(voucher.id);
    try {
      if (voucher.external_url) {
        window.open(voucher.external_url, '_blank');
      } else if (voucher.file_url) {
        window.open(voucher.file_url, '_blank');
      }
    } finally {
      // Small delay to show feedback
      setTimeout(() => setOpeningVoucher(null), 500);
    }
  };

  if (loading) {
    return <PageLoading message="Cargando tu viaje..." />;
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-20 lg:pb-8">
        <div className="px-5 pt-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-6">
            <span className="material-symbols-outlined text-5xl">travel_explore</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-white mb-3">
            No hay viajes disponibles
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            Contactá a tu agente de ventas para más información
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#3D3935] hover:bg-black/90 text-white rounded-[20px] font-bold transition-all"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-20 lg:pb-8">


      <div className="px-5 pt-4 space-y-6 max-w-4xl mx-auto">
        {/* Main Trip Card */}
        <div className="bg-[#3D3935] dark:bg-zinc-900 rounded-[40px] overflow-hidden shadow-xl">
          <div className="relative h-48">
            <img
              src={trip.banner_image_url || trip.image_url || DEFAULT_TRIP_IMAGE}
              alt={trip.destination || 'Imagen del viaje'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_TRIP_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            <div className="absolute top-4 right-4">
              <TripStatusBadge status={(trip.status_operational ?? 'PREVIO') as any} />
            </div>
          </div>
          <div className="p-8 space-y-6 text-white">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">Destino</p>
              <h2 className="text-2xl font-bold">{trip.destination}</h2>
            </div>

            <div className="grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Fechas</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                  <span className="text-[15px] font-bold">{formatDateRange(trip.start_date, trip.end_date)}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Tipo</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">
                    {trip.trip_type === 'GRUPAL' ? 'groups' : trip.trip_type === 'INDIVIDUAL' ? 'person' : 'travel_explore'}
                  </span>
                  <span className="text-[15px] font-bold">
                    {trip.trip_type === 'GRUPAL' ? 'Grupal' : trip.trip_type === 'INDIVIDUAL' ? 'Individual' : 'Viaje'}
                  </span>
                </div>
              </div>
              {trip.status_commercial && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Estado Comercial</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl font-fill">info</span>
                    <span className="text-[15px] font-bold">
                      {trip.status_commercial === 'ABIERTO' ? 'Abierto' : trip.status_commercial === 'CERRADO' ? 'Cerrado' : 'Completo'}
                    </span>
                  </div>
                </div>
              )}
              {trip.internal_code && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Código</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">tag</span>
                    <span className="text-[15px] font-bold">{trip.internal_code}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Itinerary Section */}
        <div className="space-y-4">
          <h3 className="text-[20px] font-extrabold text-triex-grey dark:text-white">
            Tu Itinerario
          </h3>

          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
            {nextActivity ? (
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#F97316]/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#F97316] text-[24px]">calendar_clock</span>
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">
                    PRÓXIMA ACTIVIDAD
                  </span>
                  <h4 className="text-lg font-bold text-triex-grey dark:text-white leading-tight mb-1">
                    {nextActivity.title}
                  </h4>
                  {nextActivity.time && (
                    <span className="inline-block px-2 py-1 bg-[#F97316]/10 rounded-md text-[#F97316] text-xs font-bold">
                      {nextActivity.time.slice(0, 5)} hs
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-zinc-400 text-[24px]">map</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-triex-grey dark:text-white leading-tight">
                    Explora tu viaje
                  </h4>
                  <p className="text-sm text-zinc-500">Revisa todas las actividades</p>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/itinerary')}
              className="w-full py-4 bg-[#E0592A] hover:bg-[#F06A3B] text-white rounded-[20px] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Ver itinerario completo
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>


        {/* Includes/Excludes */}
        <div className="grid lg:grid-cols-2 gap-6">
          {trip.includes_text && (
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-7 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-green-600 text-[20px]">check</span>
                </div>
                <h3 className="text-[18px] font-extrabold text-triex-grey dark:text-white">
                  Incluye
                </h3>
              </div>
              <div className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                {trip.includes_text}
              </div>
            </div>
          )}
          {trip.excludes_text && (
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-7 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-red-600 text-[20px]">close</span>
                </div>
                <h3 className="text-[18px] font-extrabold text-triex-grey dark:text-white">
                  No incluye
                </h3>
              </div>
              <div className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                {trip.excludes_text}
              </div>
            </div>
          )}
        </div>

        {/* Coordinator Contact */}
        {(trip.coordinator_name || trip.coordinator_phone || trip.coordinator_email) && (
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-7 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-[20px] font-extrabold text-triex-grey dark:text-white mb-5 flex items-center gap-3">
              <span className="material-symbols-outlined text-[26px]">contact_phone</span>
              Agente de Ventas
            </h3>
            <div className="space-y-3">
              {trip.coordinator_name && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-zinc-400">person</span>
                  <span className="text-[15px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {trip.coordinator_name}
                  </span>
                </div>
              )}
              {trip.coordinator_phone && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-zinc-400">call</span>
                  <a
                    href={`tel:${trip.coordinator_phone}`}
                    className="text-[15px] font-semibold text-[#E0592A] hover:underline"
                    aria-label={`Llamar al agente de ventas al ${trip.coordinator_phone}`}
                  >
                    {trip.coordinator_phone}
                  </a>
                </div>
              )}
              {trip.coordinator_email && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-zinc-400">mail</span>
                  <a
                    href={`mailto:${trip.coordinator_email}`}
                    className="text-[15px] font-semibold text-[#E0592A] hover:underline"
                    aria-label={`Enviar email al agente de ventas a ${trip.coordinator_email}`}
                  >
                    {trip.coordinator_email}
                  </a>
                </div>
              )}
            </div>
            {trip.emergency_contact && (
              <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                  Emergencias
                </p>
                <p className="text-[14px] text-zinc-700 dark:text-zinc-300">
                  {trip.emergency_contact}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Vouchers Section */}
        {vouchers.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-7 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[20px] font-extrabold text-triex-grey dark:text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-[26px]">confirmation_number</span>
                Mis Vouchers
              </h3>
              <button
                onClick={() => navigate('/travel-docs')}
                className="text-[13px] font-bold text-[#E0592A] hover:underline"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-3">
              {vouchers.slice(0, 3).map((voucher) => (
                <div
                  key={voucher.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer relative"
                  onClick={() => handleVoucherClick(voucher)}
                  role="button"
                  aria-label={`Abrir voucher ${voucher.title}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-700 rounded-xl flex items-center justify-center">
                      {openingVoucher === voucher.id ? (
                        <div className="w-5 h-5 border-2 border-[#E0592A] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[#E0592A] text-[20px]">
                          {voucher.format === 'PDF' ? 'picture_as_pdf' : voucher.format === 'IMAGE' ? 'image' : 'link'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[14px] text-zinc-800 dark:text-white">
                        {voucher.title}
                      </h4>
                      {voucher.category && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mt-0.5">
                          {voucher.category}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-zinc-400">chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Requirements */}
        {documentRequirements.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-7 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-[20px] font-extrabold text-triex-grey dark:text-white mb-5 flex items-center gap-3">
              <span className="material-symbols-outlined text-[26px]">description</span>
              Documentación requerida
            </h3>
            <div className="space-y-3">
              {documentRequirements.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-500 text-[20px]">
                        {req.is_required ? 'priority_high' : 'info'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[14px] text-zinc-800 dark:text-white">
                        {req.doc_name}
                      </h4>
                      {req.due_date && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Vence: {new Date(req.due_date).toLocaleDateString('es-AR')}
                        </p>
                      )}
                    </div>
                  </div>
                  {req.is_required && (
                    <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full uppercase tracking-wide">
                      Obligatorio
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/travel-docs')}
              className="w-full mt-5 bg-[#E0592A] hover:bg-[#F06A3B] text-white py-4 rounded-[20px] font-bold transition-all active:scale-[0.98]"
            >
              Cargar Documentación
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
