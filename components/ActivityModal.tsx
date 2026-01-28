
import React, { useState, useEffect } from 'react';
import { ItineraryItem } from '../hooks/useItineraryItems';

interface ActivityModalProps {
    isOpen: boolean;
    activity?: ItineraryItem | null;
    onSave: (activity: Partial<ItineraryItem>) => void;
    onClose: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
    isOpen,
    activity,
    onSave,
    onClose
}) => {
    const [formData, setFormData] = useState({
        time: '',
        title: '',
        description: '',
        location_name: '',
        location_detail: '',
        instructions_url: '',
        instructions_text: '',
    });

    const [instructionsMode, setInstructionsMode] = useState<'url' | 'text'>('url');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (activity) {
            setFormData({
                time: activity.time || '',
                title: activity.title || '',
                description: activity.description || '',
                location_name: activity.location_name || '',
                location_detail: activity.location_detail || '',
                instructions_url: activity.instructions_url || '',
                instructions_text: activity.instructions_text || '',
            });

            // Set mode based on what exists
            setInstructionsMode(activity.instructions_url ? 'url' : 'text');
        } else {
            setFormData({
                time: '',
                title: '',
                description: '',
                location_name: '',
                location_detail: '',
                instructions_url: '',
                instructions_text: '',
            });
        }
    }, [activity, isOpen]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'El título es obligatorio';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) {
            return;
        }

        // Clear opposite instructions mode
        const dataToSave = {
            ...formData,
            instructions_url: instructionsMode === 'url' ? formData.instructions_url : '',
            instructions_text: instructionsMode === 'text' ? formData.instructions_text : '',
        };

        onSave(dataToSave);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-triex-grey dark:text-white">
                        {activity ? 'Editar' : 'Nueva'} Actividad
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Time */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Hora (opcional)
                        </label>
                        <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => handleInputChange('time', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Ej: 09:00, 14:30</p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${errors.title ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                            placeholder="Ej: Check-in en el hotel"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            placeholder="Detalles adicionales sobre esta actividad"
                        />
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                Ubicación / Punto de encuentro
                            </label>
                            <input
                                type="text"
                                value={formData.location_name}
                                onChange={(e) => handleInputChange('location_name', e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Ej: Lobby del hotel"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                Detalle ubicación
                            </label>
                            <input
                                type="text"
                                value={formData.location_detail}
                                onChange={(e) => handleInputChange('location_detail', e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Ej: Piso 1, junto a recepción"
                            />
                        </div>
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Instrucciones (opcional)
                        </label>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setInstructionsMode('url')}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${instructionsMode === 'url'
                                        ? 'bg-primary text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                URL / Link
                            </button>
                            <button
                                type="button"
                                onClick={() => setInstructionsMode('text')}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${instructionsMode === 'text'
                                        ? 'bg-primary text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                Texto
                            </button>
                        </div>

                        {instructionsMode === 'url' ? (
                            <input
                                type="url"
                                value={formData.instructions_url}
                                onChange={(e) => handleInputChange('instructions_url', e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="https://ejemplo.com/instrucciones"
                            />
                        ) : (
                            <textarea
                                value={formData.instructions_text}
                                onChange={(e) => handleInputChange('instructions_text', e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                placeholder="Escribe las instrucciones aquí..."
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};
