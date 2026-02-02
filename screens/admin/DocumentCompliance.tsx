import React, { useState, useEffect } from 'react';
import { useTrips } from '../../hooks/useTrips';
import { useDocuments, RequiredDocument, PassengerDocument } from '../../hooks/useDocuments';
import { supabase } from '../../lib/supabase';

interface TripPassenger {
    passenger_id: string;
    passengers: {
        id: string;
        first_name: string;
        last_name: string;
    };
}

export const AdminDocumentCompliance: React.FC = () => {
    const { trips } = useTrips();
    const {
        requiredDocuments,
        fetchRequiredDocuments,
        passengerDocuments,
        fetchPassengerDocuments
    } = useDocuments();

    const [selectedTripId, setSelectedTripId] = useState<string>('');
    const [tripPassengers, setTripPassengers] = useState<TripPassenger[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedTripId) {
            loadTripData(selectedTripId);
        } else {
            setTripPassengers([]);
        }
    }, [selectedTripId]);

    const loadTripData = async (tripId: string) => {
        setLoading(true);
        try {
            // Fetch Requirements and Uploaded Docs
            await Promise.all([
                fetchRequiredDocuments(tripId),
                fetchPassengerDocuments({ tripId })
            ]);

            // Fetch Trip Passengers
            const { data, error } = await supabase
                .from('trip_passengers')
                .select('passenger_id, passengers(id, first_name, last_name)')
                .eq('trip_id', tripId);

            if (error) throw error;
            setTripPassengers(data as any || []);

        } catch (error) {
            console.error('Error loading compliance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (passengerId: string, reqDocId: string) => {
        const doc = passengerDocuments.find(
            pd => pd.passenger_id === passengerId && pd.required_document_id === reqDocId
        );

        if (!doc) return 'missing';
        return doc.status;
    };

    return (
        <div className="space-y-6">
            {/* Header & Filter */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Seleccionar Viaje</label>
                <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="w-full sm:w-1/2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="">Selecciona un viaje...</option>
                    {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>{trip.name}</option>
                    ))}
                </select>
            </div>

            {/* Matrix */}
            {selectedTripId && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <p className="mt-4 text-sm text-zinc-500">Cargando datos de cumplimiento...</p>
                        </div>
                    ) : tripPassengers.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500">
                            No hay pasajeros asignados a este viaje.
                        </div>
                    ) : requiredDocuments.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500">
                            Este viaje no tiene documentos requeridos configurados.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase sticky left-0 bg-zinc-50 dark:bg-zinc-800 z-10 w-48">
                                            Pasajero
                                        </th>
                                        {requiredDocuments.map(req => (
                                            <th key={req.id} className="text-center px-4 py-4 text-xs font-bold text-zinc-500 uppercase min-w-[120px]">
                                                {req.document_types?.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {tripPassengers.map((tp) => (
                                        <tr key={tp.passenger_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 sticky left-0 bg-white dark:bg-zinc-900">
                                                {tp.passengers?.first_name} {tp.passengers?.last_name}
                                            </td>
                                            {requiredDocuments.map((req) => {
                                                const status = getStatus(tp.passenger_id, req.id);
                                                return (
                                                    <td key={req.id} className="px-4 py-4 text-center">
                                                        {status === 'missing' && (
                                                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                                                Falta
                                                            </span>
                                                        )}
                                                        {status === 'uploaded' && (
                                                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                                                En revisión
                                                            </span>
                                                        )}
                                                        {status === 'approved' && (
                                                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                                                Aprobado
                                                            </span>
                                                        )}
                                                        {status === 'rejected' && (
                                                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                                                Rechazado
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
