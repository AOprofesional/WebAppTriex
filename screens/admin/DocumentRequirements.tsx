import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import { useTrips } from '../../hooks/useTrips';

export const AdminDocumentRequirements: React.FC = () => {
    const { documentTypes, fetchDocumentTypes, fetchRequiredDocuments, saveRequiredDocuments, loading } = useDocuments();
    const { trips } = useTrips();
    const [selectedTripId, setSelectedTripId] = useState<string>('');
    const [requirements, setRequirements] = useState<any[]>([]);

    useEffect(() => {
        fetchDocumentTypes();
    }, []);

    useEffect(() => {
        if (selectedTripId) {
            loadRequirements();
        }
    }, [selectedTripId]);

    const loadRequirements = async () => {
        const { data } = await fetchRequiredDocuments(selectedTripId);
        setRequirements(data || []);
    };

    const handleAddRequirement = () => {
        setRequirements([
            ...requirements,
            {
                doc_type_id: documentTypes[0]?.id || '',
                is_required: true,
                description: '',
                due_date: ''
            }
        ]);
    };

    const handleRemoveRequirement = (index: number) => {
        setRequirements(requirements.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!selectedTripId) return;

        const { error } = await saveRequiredDocuments(selectedTripId, requirements);
        if (error) {
            alert('Error al guardar requisitos: ' + error);
        } else {
            alert('Requisitos guardados correctamente');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-triex-grey dark:text-white">Requisitos de Documentos</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Configura los documentos requeridos para cada viaje
                </p>
            </div>

            {/* Trip Selector */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                    Seleccionar Viaje
                </label>
                <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="">-- Selecciona un viaje --</option>
                    {trips.map((trip: any) => (
                        <option key={trip.id} value={trip.id}>
                            {trip.name} - {trip.destination}
                        </option>
                    ))}
                </select>
            </div>

            {/* Requirements List */}
            {selectedTripId && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-triex-grey dark:text-white">
                            Documentos Requeridos
                        </h2>
                        <button
                            onClick={handleAddRequirement}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Agregar Requisito
                        </button>
                    </div>

                    {requirements.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-zinc-400">checklist</span>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                No hay requisitos configurados para este viaje
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requirements.map((req, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 items-start p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Tipo de Documento</label>
                                        <select
                                            value={req.doc_type_id}
                                            onChange={(e) => {
                                                const newReqs = [...requirements];
                                                newReqs[index].doc_type_id = e.target.value;
                                                setRequirements(newReqs);
                                            }}
                                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                                        >
                                            {documentTypes.map((dt) => (
                                                <option key={dt.id} value={dt.id}>{dt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Descripción</label>
                                        <input
                                            type="text"
                                            value={req.description || ''}
                                            onChange={(e) => {
                                                const newReqs = [...requirements];
                                                newReqs[index].description = e.target.value;
                                                setRequirements(newReqs);
                                            }}
                                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                                            placeholder="Ej: Vigente al menos 6 meses"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Fecha Límite</label>
                                        <input
                                            type="date"
                                            value={req.due_date || ''}
                                            onChange={(e) => {
                                                const newReqs = [...requirements];
                                                newReqs[index].due_date = e.target.value;
                                                setRequirements(newReqs);
                                            }}
                                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={req.is_required}
                                                onChange={(e) => {
                                                    const newReqs = [...requirements];
                                                    newReqs[index].is_required = e.target.checked;
                                                    setRequirements(newReqs);
                                                }}
                                                className="w-4 h-4 rounded border-zinc-300"
                                            />
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">Obligatorio</span>
                                        </label>
                                    </div>
                                    <div className="col-span-1 flex items-end justify-end">
                                        <button
                                            onClick={() => handleRemoveRequirement(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {requirements.length > 0 && (
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
