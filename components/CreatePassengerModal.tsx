import React, { useState } from 'react';
import { useCreatePassengerWithInvite } from '../hooks/useCreatePassengerWithInvite';
import { usePassengers } from '../hooks/usePassengers';

interface CreatePassengerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreatePassengerModal: React.FC<CreatePassengerModalProps> = ({ isOpen, onClose }) => {
    const { createAndInvite, creating } = useCreatePassengerWithInvite();
    const { refetch } = usePassengers();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        passenger_type_id: 1, // Regular por defecto
        birth_date: '',
        cuil: '',
        document_type: '' as 'DNI' | 'Pasaporte' | 'Otro' | '',
        document_number: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await createAndInvite({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone || undefined,
            passenger_type_id: formData.passenger_type_id,
            birth_date: formData.birth_date || undefined,
            cuil: formData.cuil || undefined,
            document_type: formData.document_type || undefined,
            document_number: formData.document_number || undefined
        });

        if (result.success) {
            alert(result.message);
            refetch(); // Refrescar lista de pasajeros
            onClose();
            // Reset form
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                passenger_type_id: 1,
                birth_date: '',
                cuil: '',
                document_type: '',
                document_number: ''
            });
        } else {
            alert(result.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Nuevo Pasajero</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Datos Básicos */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-zinc-800 dark:text-white">Datos Básicos</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Juan"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Apellido *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Pérez"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Email * <span className="text-xs text-zinc-500">(Se enviará invitación a este email)</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="juan.perez@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="+54 9 11 1234-5678"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Tipo de Pasajero *
                                </label>
                                <select
                                    required
                                    value={formData.passenger_type_id}
                                    onChange={(e) => setFormData({ ...formData, passenger_type_id: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value={1}>Regular</option>
                                    <option value={2}>VIP</option>
                                    <option value={3}>Corporativo</option>
                                    <option value={4}>Otro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Datos Adicionales (Opcionales) */}
                    <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <h3 className="font-bold text-zinc-800 dark:text-white">Datos Adicionales (Opcional)</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Fecha de Nacimiento
                                </label>
                                <input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    CUIL
                                </label>
                                <input
                                    type="text"
                                    value={formData.cuil}
                                    onChange={(e) => setFormData({ ...formData, cuil: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="20-12345678-9"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Tipo de Documento
                                </label>
                                <select
                                    value={formData.document_type}
                                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value as any })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="DNI">DNI</option>
                                    <option value="Pasaporte">Pasaporte</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Número de Documento
                                </label>
                                <input
                                    type="text"
                                    value={formData.document_number}
                                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="12345678"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={creating}
                            className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {creating ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">send</span>
                                    Crear y Enviar Invitación
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
