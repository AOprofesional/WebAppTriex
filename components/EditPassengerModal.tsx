import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type PassengerListView = Database['public']['Views']['v_admin_passengers_list']['Row'];

interface EditPassengerModalProps {
    passenger: PassengerListView | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const EditPassengerModal: React.FC<EditPassengerModalProps> = ({
    passenger,
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        passenger_email: '',
        phone: '',
        document_type: 'DNI',
        document_number: '',
        type_code: 'regular',
        is_recurrent: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (passenger) {
            setFormData({
                first_name: passenger.first_name || '',
                last_name: passenger.last_name || '',
                passenger_email: passenger.passenger_email || '',
                phone: passenger.phone || '',
                document_type: passenger.document_type || 'DNI',
                document_number: passenger.document_number || '',
                type_code: passenger.type_code || 'regular',
                is_recurrent: passenger.is_recurrent || false,
            });
        }
    }, [passenger]);

    if (!isOpen || !passenger) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error: updateError } = await supabase
                .from('passengers')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    passenger_email: formData.passenger_email,
                    phone: formData.phone || null,
                    document_type: formData.document_type,
                    document_number: formData.document_number || null,
                    type_code: formData.type_code,
                    is_recurrent: formData.is_recurrent,
                })
                .eq('id', passenger.id);

            if (updateError) throw updateError;

            onSave();
            onClose();
        } catch (err: any) {
            console.error('Error updating passenger:', err);
            setError(err.message || 'Error al actualizar pasajero');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-white">
                        Editar Pasajero
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                                Apellido *
                            </label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.passenger_email}
                            onChange={(e) => setFormData({ ...formData, passenger_email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="+54 9 11 1234-5678"
                        />
                    </div>

                    {/* Document */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                                Tipo Doc.
                            </label>
                            <select
                                value={formData.document_type}
                                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="DNI">DNI</option>
                                <option value="Pasaporte">Pasaporte</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                                Número de Documento
                            </label>
                            <input
                                type="text"
                                value={formData.document_number}
                                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Passenger Type */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                            Tipo de Pasajero
                        </label>
                        <select
                            value={formData.type_code}
                            onChange={(e) => setFormData({ ...formData, type_code: e.target.value })}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="regular">Regular</option>
                            <option value="vip">VIP</option>
                            <option value="corporate">Corporativo</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    {/* Recurrent Checkbox */}
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                        <input
                            type="checkbox"
                            id="is_recurrent"
                            checked={formData.is_recurrent}
                            onChange={(e) => setFormData({ ...formData, is_recurrent: e.target.checked })}
                            className="w-5 h-5 text-primary bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-2 focus:ring-primary/20"
                        />
                        <label htmlFor="is_recurrent" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Marcar como pasajero recurrente
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
