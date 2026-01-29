import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import { useTrips } from '../../hooks/useTrips';

export const AdminDocumentReview: React.FC = () => {
    const { passengerDocuments, fetchPassengerDocuments, reviewDocument, getDocumentSignedUrl, loading } = useDocuments();
    const { trips } = useTrips();
    const [filterTripId, setFilterTripId] = useState('');
    const [filterStatus, setFilterStatus] = useState('uploaded');
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [reviewComment, setReviewComment] = useState('');

    useEffect(() => {
        loadDocuments();
    }, [filterTripId, filterStatus]);

    const loadDocuments = async () => {
        await fetchPassengerDocuments({
            tripId: filterTripId || undefined,
            status: filterStatus || undefined
        });
    };

    const handleViewDocument = async (doc: any) => {
        setSelectedDoc(doc);
        const { signedUrl: url } = await getDocumentSignedUrl(doc.file_url);
        setSignedUrl(url);
    };

    const handleReview = async (status: 'approved' | 'rejected') => {
        if (!selectedDoc) return;

        if (status === 'rejected' && !reviewComment.trim()) {
            alert('Debes proporcionar un comentario al rechazar un documento');
            return;
        }

        const { error } = await reviewDocument(selectedDoc.id, status, reviewComment);
        if (error) {
            alert('Error al revisar documento: ' + error);
        } else {
            alert(`Documento ${status === 'approved' ? 'aprobado' : 'rechazado'} correctamente`);
            setSelectedDoc(null);
            setSignedUrl(null);
            setReviewComment('');
            loadDocuments();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-triex-grey dark:text-white">Revisión de Documentos</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Aprueba o rechaza documentos cargados por pasajeros
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Viaje</label>
                        <select
                            value={filterTripId}
                            onChange={(e) => setFilterTripId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Todos los viajes</option>
                            {trips.map((trip: any) => (
                                <option key={trip.id} value={trip.id}>{trip.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Estado</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Todos</option>
                            <option value="uploaded">Pendiente de revisión</option>
                            <option value="approved">Aprobado</option>
                            <option value="rejected">Rechazado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Documents List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm text-zinc-500">Cargando documentos...</p>
                    </div>
                ) : passengerDocuments.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-zinc-400">fact_check</span>
                        </div>
                        <h3 className="text-lg font-bold text-triex-grey dark:text-white mb-2">
                            No hay documentos
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            No se encontraron documentos con los filtros aplicados
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Pasajero</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Documento</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Estado</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Fecha Subida</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {passengerDocuments.map((doc: any) => (
                                    <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                                            {doc.passengers?.first_name} {doc.passengers?.last_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                                            {doc.required_documents?.document_types?.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${doc.status === 'approved' ? 'bg-green-50 text-green-600' :
                                                    doc.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                                        'bg-amber-50 text-amber-600'
                                                }`}>
                                                {doc.status === 'approved' ? 'Aprobado' : doc.status === 'rejected' ? 'Rechazado' : 'En revisión'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                                            {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('es-AR') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleViewDocument(doc)}
                                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                            >
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Document Review Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-triex-grey dark:text-white">
                                Revisar Documento
                            </h2>
                            <button
                                onClick={() => {
                                    setSelectedDoc(null);
                                    setSignedUrl(null);
                                    setReviewComment('');
                                }}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Document Preview */}
                            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 min-h-[400px] flex items-center justify-center">
                                {signedUrl ? (
                                    selectedDoc.format === 'pdf' ? (
                                        <iframe src={signedUrl} className="w-full h-[500px] rounded-lg" />
                                    ) : (
                                        <img src={signedUrl} alt="Documento" className="max-w-full max-h-[500px] rounded-lg" />
                                    )
                                ) : (
                                    <div className="text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                                        <p className="text-sm text-zinc-500">Cargando documento...</p>
                                    </div>
                                )}
                            </div>

                            {/* Review Comment */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Comentario (obligatorio al rechazar)
                                </label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Escribe un comentario sobre el documento..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => handleReview('rejected')}
                                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-all"
                                >
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleReview('approved')}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-all"
                                >
                                    Aprobar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
