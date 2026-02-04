
import React, { useState, useEffect } from 'react';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { useTrips } from '../../hooks/useTrips';
import { usePassengers } from '../../hooks/usePassengers';

interface CreateNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({ isOpen, onClose }) => {
    const { createNotification, createBulkNotifications, getTripPassengerIds, getAllPassengerIds } = useAdminNotifications();
    const { trips } = useTrips();
    const { passengers } = usePassengers();

    const [target, setTarget] = useState<'specific' | 'trip' | 'all'>('specific');
    const [passengerId, setPassengerId] = useState('');
    const [tripId, setTripId] = useState('');
    const [type, setType] = useState('info');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setTarget('specific');
            setPassengerId('');
            setTripId('');
            setType('info');
            setTitle('');
            setMessage('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            if (target === 'specific') {
                if (!passengerId) {
                    alert('Por favor seleccioná un pasajero');
                    return;
                }
                const result = await createNotification({
                    passengerId,
                    tripId: tripId || undefined,
                    type,
                    title,
                    message,
                });

                if (result.error) {
                    alert(`Error: ${result.error}`);
                } else {
                    alert('Notificación enviada correctamente');
                    onClose();
                }
            } else if (target === 'trip') {
                if (!tripId) {
                    alert('Por favor seleccioná un viaje');
                    return;
                }
                const passengerIds = await getTripPassengerIds(tripId);
                if (passengerIds.length === 0) {
                    alert('No hay pasajeros en este viaje');
                    return;
                }

                const result = await createBulkNotifications({
                    passengerIds,
                    tripId,
                    type,
                    title,
                    message,
                });

                if (result.error) {
                    alert(`Error: ${result.error}`);
                } else {
                    alert(`Notificación enviada a ${passengerIds.length} pasajero(s)`);
                    onClose();
                }
            } else if (target === 'all') {
                const passengerIds = await getAllPassengerIds();
                if (passengerIds.length === 0) {
                    alert('No hay pasajeros activos');
                    return;
                }

                const result = await createBulkNotifications({
                    passengerIds,
                    type,
                    title,
                    message,
                });

                if (result.error) {
                    alert(`Error: ${result.error}`);
                } else {
                    alert(`Notificación enviada a ${passengerIds.length} pasajero(s)`);
                    onClose();
                }
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Enviar Notificación</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-zinc-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Target Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Enviar a
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTarget('specific')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${target === 'specific'
                                    ? 'bg-primary text-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                    }`}
                            >
                                Pasajero
                            </button>
                            <button
                                type="button"
                                onClick={() => setTarget('trip')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${target === 'trip'
                                    ? 'bg-primary text-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                    }`}
                            >
                                Viaje
                            </button>
                            <button
                                type="button"
                                onClick={() => setTarget('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${target === 'all'
                                    ? 'bg-primary text-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                    }`}
                            >
                                Todos
                            </button>
                        </div>
                    </div>

                    {/* Passenger Selection (if specific) */}
                    {target === 'specific' && (
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                Pasajero *
                            </label>
                            <select
                                value={passengerId}
                                onChange={(e) => setPassengerId(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                            >
                                <option value="">Seleccionar pasajero...</option>
                                {passengers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.first_name} {p.last_name} ({p.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Trip Selection */}
                    {target === 'trip' && (
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                Viaje *
                            </label>
                            <select
                                value={tripId}
                                onChange={(e) => setTripId(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                            >
                                <option value="">Seleccionar viaje...</option>
                                {trips.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} - {t.destination}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Optional Trip Association */}
                    {target === 'specific' && (
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                Asociar a viaje (opcional)
                            </label>
                            <select
                                value={tripId}
                                onChange={(e) => setTripId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                            >
                                <option value="">Ninguno</option>
                                {trips.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} - {t.destination}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Notification Type */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Tipo *
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                        >
                            <option value="info">Información</option>
                            <option value="success">Éxito</option>
                            <option value="warning">Advertencia</option>
                            <option value="error">Error</option>
                            <option value="trip_update">Actualización de viaje</option>
                            <option value="trip_reminder">Recordatorio de viaje</option>
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            maxLength={100}
                            placeholder="Título de la notificación"
                            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Mensaje *
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            maxLength={500}
                            rows={4}
                            placeholder="Contenido de la notificación"
                            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm resize-none"
                        />
                        <p className="text-xs text-zinc-400 mt-1">{message.length}/500 caracteres</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={sending}
                            className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={sending}
                            className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-xl">send</span>
                                    Enviar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
