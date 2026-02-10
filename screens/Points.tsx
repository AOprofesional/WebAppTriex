import React from 'react';
import { usePassenger } from '../hooks/usePassenger';
import { useOrangePass } from '../hooks/useOrangePass';
import { formatPoints, getExpirationMessage, getCategoryLabel } from '../utils/orangePassHelpers';
import { PageLoading } from '../components/PageLoading';

export const Points: React.FC = () => {
  const { passenger, loading: passengerLoading } = usePassenger();
  const {
    loading,
    balance,
    pointsHistory,
    referredPassengers,
  } = useOrangePass(passenger?.id);

  if (passengerLoading || loading) return <PageLoading />;
  if (!passenger) return null;

  const isMember = passenger.is_orange_member;

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-4xl">card_giftcard</span>
            <div>
              <h1 className="text-2xl font-bold">Orange Pass</h1>
              <p className="text-orange-100 text-sm">Programa de Referidos y Puntos</p>
            </div>
          </div>

          {isMember ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs text-orange-100 mb-1">Número de Miembro</p>
              <p className="text-2xl font-bold tracking-wide">{passenger.orange_member_number}</p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm">
                🎉 ¡Se activa automáticamente cuando te asignan a un viaje!
              </p>
            </div>
          )}
        </div>

        {/* Points Balance - Only show if member */}
        {isMember && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">stars</span>
              Mis Puntos
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {formatPoints(balance.active)}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Activos</p>
              </div>
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-3xl font-bold text-zinc-700 dark:text-zinc-300">
                  {formatPoints(balance.total)}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Total Acumulado</p>
              </div>
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-3xl font-bold text-zinc-500">
                  {formatPoints(balance.expired)}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Expirados</p>
              </div>
            </div>
          </div>
        )}

        {/* Referral Code */}
        {isMember && passenger.orange_referral_code && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">share</span>
              Tu Código de Referido
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border-2 border-dashed border-orange-300 dark:border-orange-700">
                <p className="text-3xl font-bold text-center text-orange-600 dark:text-orange-400 tracking-widest font-mono">
                  {passenger.orange_referral_code}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(passenger.orange_referral_code || '');
                  alert('Código copiado al portapapeles');
                }}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">content_copy</span>
                Copiar
              </button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">
              Comparte este código con tus amigos. Cuando realicen una compra confirmada, ¡recibirás puntos!
            </p>
          </div>
        )}

        {/* Referred Passengers */}
        {referredPassengers.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">group</span>
              Personas Referidas ({referredPassengers.length})
            </h2>
            <div className="space-y-3">
              {referredPassengers.map((referred) => (
                <div
                  key={referred.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-white">
                      {referred.first_name} {referred.last_name}
                    </p>
                    <p className="text-xs text-zinc-500">{referred.email}</p>
                  </div>
                  <div className="text-right">
                    {referred.points_awarded ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Puntos Acreditados
                      </span>
                    ) : referred.has_confirmed_purchase ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">pending</span>
                        Compra Confirmada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">airplane_ticket</span>
                        Viaje Asignado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points History */}
        {isMember && pointsHistory.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">history</span>
              Historial de Puntos
            </h2>
            <div className="space-y-3">
              {pointsHistory.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-800 dark:text-white">
                      +{entry.points} puntos
                    </p>
                    <p className="text-xs text-zinc-500">
                      {entry.source_passenger?.first_name} {entry.source_passenger?.last_name}
                    </p>
                    {entry.trip && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {entry.trip.name} • {getCategoryLabel(entry.trip_category)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">
                      {new Date(entry.credited_at).toLocaleDateString('es-AR')}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {getExpirationMessage(entry.expires_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info for non-members */}
        {!isMember && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">
              ¿Cómo funciona Orange Pass?
            </h2>
            <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-orange-500">looks_one</span>
                <p><strong>Activa tu membresía:</strong> Automáticamente al tener tu primer viaje asignado</p>
              </div>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-orange-500">looks_two</span>
                <p><strong>Recibe tu código:</strong> Te asignaremos un código único para compartir</p>
              </div>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-orange-500">looks_3</span>
                <p><strong>Refiere amigos:</strong> Comparte tu código con amigos y familiares</p>
              </div>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-orange-500">looks_4</span>
                <p><strong>Acumula puntos:</strong> Gana entre 10-40 puntos por cada amigo que viaje</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
