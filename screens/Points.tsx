// Imports updated
import React, { useState } from 'react';
import { usePassenger } from '../hooks/usePassenger';
import { useOrangePass } from '../hooks/useOrangePass';
import { formatPoints, getExpirationMessage, getCategoryLabel } from '../utils/orangePassHelpers';
import { PageLoading } from '../components/PageLoading';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';

export const Points: React.FC = () => {
  const { passenger, loading: passengerLoading } = usePassenger();
  const {
    loading,
    balance,
    pointsHistory,
    redemptionHistory,
    referredPassengers,
  } = useOrangePass(passenger?.id);
  const toast = useToast();

  // Redemption State
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [redemptionType, setRedemptionType] = useState<'NEXT_TRIP' | 'CASH'>('NEXT_TRIP');
  const [pointsToRedeem, setPointsToRedeem] = useState<string>('');
  const [redemptionComment, setRedemptionComment] = useState('');
  const [isSubmittingRedemption, setIsSubmittingRedemption] = useState(false);

  if (passengerLoading || loading) return <PageLoading />;
  if (!passenger) return null;

  const isMember = passenger.is_orange_member;

  // Detect expiring points (within 30 days)
  const expiringPoints = pointsHistory.filter((point: any) => {
    if (!point.expires_at || point.points_amount <= 0) return false;
    const expirationDate = new Date(point.expires_at);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
  });

  const totalExpiringPoints = expiringPoints.reduce((sum: number, point: any) => sum + point.points_amount, 0);

  const handleRedemptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsToRedeem || isSubmittingRedemption) return;

    const points = parseInt(pointsToRedeem, 10);
    if (isNaN(points) || points <= 0) {
      toast.error('Cantidad inválida', 'Debes ingresar una cantidad de puntos válida.');
      return;
    }

    if (points > balance.total) {
      toast.error('Puntos insuficientes', `Solo tienes ${balance.total} puntos disponibles.`);
      return;
    }

    setIsSubmittingRedemption(true);
    try {
      const { error } = await supabase
        .from('redemption_requests')
        .insert({
          passenger_id: passenger.id,
          type: redemptionType,
          points_amount: points,
          comment: redemptionComment,
          status: 'PENDING'
        });

      if (error) throw error;

      toast.success('¡Solicitud enviada!', 'Te responderemos en 3 a 5 días hábiles.');
      setShowRedemptionModal(false);
      setPointsToRedeem('');
      setRedemptionComment('');
    } catch (err: any) {
      console.error('Error submitting redemption:', err);
      toast.error('Error al enviar solicitud', err.message || 'Por favor, intenta nuevamente.');
    } finally {
      setIsSubmittingRedemption(false);
    }
  };

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
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-orange-100 mb-1">Número de Miembro</p>
                <p className="text-2xl font-bold tracking-wide">{passenger.orange_member_number}</p>
              </div>
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
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">stars</span>
                Mis Puntos
              </h2>
              {balance.total > 0 && (
                <button
                  onClick={() => setShowRedemptionModal(true)}
                  className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">redeem</span>
                  Canjear Puntos
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {formatPoints(balance.total)}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Disponibles</p>
              </div>

              {balance.locked && balance.locked > 0 ? (
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {formatPoints(balance.locked)}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">En Canje</p>
                </div>
              ) : (
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-3xl font-bold text-zinc-700 dark:text-zinc-300">
                    {formatPoints(balance.active)}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Puntos Ganados</p>
                </div>
              )}

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
                  toast.success('Código copiado', 'Tu código de referido ha sido copiado al portapapeles.');
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

        {/* Redemption History */}
        {isMember && redemptionHistory.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">redeem</span>
              Historial de Canjes
            </h2>
            <div className="space-y-3">
              {redemptionHistory.map((redemption: any) => (
                <div
                  key={redemption.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-800 dark:text-white">
                      {redemption.points_amount} puntos - {
                        redemption.type === 'NEXT_TRIP' ? 'Descuento en viaje' : 'Retiro en efectivo'
                      }
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(redemption.created_at).toLocaleDateString('es-AR')}
                    </p>
                    {redemption.admin_comment && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 italic">
                        Nota: {redemption.admin_comment}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {redemption.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">pending</span>
                        Pendiente
                      </span>
                    )}
                    {redemption.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Completado
                      </span>
                    )}
                    {redemption.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        Rechazado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                    <p className={`font-semibold ${entry.points < 0 ? 'text-red-500' : 'text-zinc-800 dark:text-white'}`}>
                      {entry.points > 0 ? '+' : ''}{entry.points} puntos
                    </p>
                    <p className="text-xs text-zinc-500">
                      {entry.reason === 'REDEEM' ? 'Canje de Puntos' :
                        entry.reason === 'REFERRAL_PURCHASE' ? 'Referido Compra' :
                          entry.reason}
                    </p>
                    {entry.source_passenger && (
                      <p className="text-xs text-zinc-400">
                        De: {entry.source_passenger.first_name} {entry.source_passenger.last_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">
                      {new Date(entry.created_at).toLocaleDateString('es-AR')}
                    </p>
                    {entry.points > 0 && (
                      <p className="text-xs text-zinc-500">
                        {getExpirationMessage(entry.expires_at)}
                      </p>
                    )}
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

      {/* Redemption Modal */}
      {showRedemptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-white">Canjear Puntos</h3>
              <button onClick={() => setShowRedemptionModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRedemptionSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">¿Cómo quieres usar tus puntos?</span>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setRedemptionType('NEXT_TRIP')}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${redemptionType === 'NEXT_TRIP'
                        ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:border-orange-200'
                        }`}
                    >
                      Usar en próximo viaje
                    </button>
                    <button
                      type="button"
                      onClick={() => setRedemptionType('CASH')}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${redemptionType === 'CASH'
                        ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:border-orange-200'
                        }`}
                    >
                      Retirar dinero
                    </button>
                  </div>
                </label>

                {redemptionType === 'NEXT_TRIP' ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400 flex gap-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Aplicaremos el descuento en tu próxima compra de viaje.
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs text-yellow-700 dark:text-yellow-400 flex gap-2">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    El dinero se retira en oficina (no se entrega dentro de la app).
                  </div>
                )}

                <label className="block">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cantidad a canjear</span>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      min="1"
                      max={balance.total}
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={`Máximo ${balance.total}`}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">PTS</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 text-right">Disponible: {balance.total} pts</p>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Comentario (Opcional)</span>
                  <textarea
                    value={redemptionComment}
                    onChange={(e) => setRedemptionComment(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 h-20 resize-none text-sm"
                    placeholder="Alguna preferencia o detalle..."
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmittingRedemption || !pointsToRedeem}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {isSubmittingRedemption ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
