import React, { useState, useEffect } from 'react';
import { useAdminVouchers } from '../../hooks/useAdminVouchers';
import { useTrips } from '../../hooks/useTrips';
import { usePassengers } from '../../hooks/usePassengers';

interface VoucherFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    voucher?: any; // For editing
    onSuccess: () => void;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
    isOpen,
    onClose,
    voucher,
    onSuccess,
}) => {
    const { voucherTypes, fetchVoucherTypes, createVoucher, updateVoucher, loading } = useAdminVouchers();
    const { trips } = useTrips();
    const { passengers } = usePassengers();

    const [formData, setFormData] = useState({
        title: '',
        type_id: '',
        format: 'pdf' as 'pdf' | 'image' | 'link',
        assignment: 'trip' as 'trip' | 'passenger',
        trip_id: '',
        passenger_id: '',
        provider_name: '',
        service_date: '',
        external_url: '',
        visibility: 'all_trip_passengers' as 'passenger_only' | 'all_trip_passengers',
        notes: '',
    });

    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchVoucherTypes();
            if (voucher) {
                setFormData({
                    title: voucher.title || '',
                    type_id: voucher.type_id || '',
                    format: voucher.format || 'pdf',
                    assignment: voucher.trip_id && !voucher.passenger_id ? 'trip' : 'passenger',
                    trip_id: voucher.trip_id || '',
                    passenger_id: voucher.passenger_id || '',
                    provider_name: voucher.provider_name || '',
                    service_date: voucher.service_date || '',
                    external_url: voucher.external_url || '',
                    visibility: voucher.visibility || 'all_trip_passengers',
                    notes: voucher.notes || '',
                });
            }
        }
    }, [isOpen, voucher]);

    useEffect(() => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    }, [file]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const voucherData = {
            title: formData.title,
            type_id: formData.type_id,
            format: formData.format,
            trip_id: formData.assignment === 'trip' && formData.trip_id ? formData.trip_id : null,
            passenger_id: formData.assignment === 'passenger' && formData.passenger_id ? formData.passenger_id : null,
            provider_name: formData.provider_name || undefined,
            service_date: formData.service_date || undefined,
            external_url: formData.format === 'link' ? formData.external_url : undefined,
            visibility: formData.visibility,
            notes: formData.notes || undefined,
        };

        let result;
        if (voucher) {
            result = await updateVoucher(voucher.id, voucherData, file || undefined);
        } else {
            result = await createVoucher(voucherData, file || undefined);
        }

        if (result.error) {
            alert('Error: ' + result.error);
        } else {
            onSuccess();
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            type_id: '',
            format: 'pdf',
            assignment: 'trip',
            trip_id: '',
            passenger_id: '',
            provider_name: '',
            service_date: '',
            external_url: '',
            visibility: 'all_trip_passengers',
            notes: '',
        });
        setFile(null);
        setFilePreview(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <h2 className="text-xl font-bold text-triex-grey dark:text-white">
                        {voucher ? 'Editar Voucher' : 'Nuevo Voucher'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            maxLength={200}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Ej: Voucher Hotel Hilton"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                            Tipo de Voucher *
                        </label>
                        <select
                            value={formData.type_id}
                            onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                            required
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Seleccionar tipo</option>
                            {voucherTypes.map((type) => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Format */}
                    <div>
                        <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                            Formato *
                        </label>
                        <div className="flex gap-4">
                            {(['pdf', 'image', 'link'] as const).map((format) => (
                                <label key={format} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="format"
                                        value={format}
                                        checked={formData.format === format}
                                        onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">{format === 'image' ? 'Imagen' : format === 'link' ? 'Link Externo' : 'PDF'}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Assignment */}
                    <div>
                        <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                            Asignar a *
                        </label>
                        <div className="flex gap-4 mb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="assignment"
                                    value="trip"
                                    checked={formData.assignment === 'trip'}
                                    onChange={() => setFormData({ ...formData, assignment: 'trip', passenger_id: '' })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">Todo el viaje</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="assignment"
                                    value="passenger"
                                    checked={formData.assignment === 'passenger'}
                                    onChange={() => setFormData({ ...formData, assignment: 'passenger' })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">Pasajero específico</span>
                            </label>
                        </div>

                        {formData.assignment === 'trip' ? (
                            <select
                                value={formData.trip_id}
                                onChange={(e) => setFormData({ ...formData, trip_id: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Seleccionar viaje</option>
                                {trips.map((trip: any) => (
                                    <option key={trip.id} value={trip.id}>
                                        {trip.name} - {trip.destination}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select
                                value={formData.passenger_id}
                                onChange={(e) => setFormData({ ...formData, passenger_id: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Seleccionar pasajero</option>
                                {passengers.map((passenger: any) => (
                                    <option key={passenger.id} value={passenger.id}>
                                        {passenger.first_name} {passenger.last_name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Visibility (only for trip assignment) */}
                    {formData.assignment === 'trip' && (
                        <div>
                            <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                                Visibilidad
                            </label>
                            <select
                                value={formData.visibility}
                                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="all_trip_passengers">Todos los pasajeros del viaje</option>
                                <option value="passenger_only">Solo pasajero asignado</option>
                            </select>
                        </div>
                    )}

                    {/* Provider & Service Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                                Proveedor
                            </label>
                            <input
                                type="text"
                                value={formData.provider_name}
                                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Ej: Hilton"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                                Fecha de Servicio
                            </label>
                            <input
                                type="date"
                                value={formData.service_date}
                                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* File or Link */}
                    {formData.format === 'link' ? (
                        <div>
                            <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                                URL Externa *
                            </label>
                            <input
                                type="url"
                                value={formData.external_url}
                                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="https://ejemplo.com/voucher"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                                Archivo {voucher ? '' : '*'}
                            </label>
                            <input
                                type="file"
                                accept={formData.format === 'pdf' ? '.pdf' : 'image/*'}
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                required={!voucher}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            {filePreview && (
                                <div className="mt-3">
                                    <img src={filePreview} alt="Preview" className="max-w-full h-40 object-contain rounded-lg" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                            Notas
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Información adicional..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : voucher ? 'Actualizar' : 'Crear Voucher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
