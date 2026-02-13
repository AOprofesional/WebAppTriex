import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
    // usePassengers kept for broader context if needed, but we fetch trip specific passengers manually
    usePassengers();

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
    const [tripPassengers, setTripPassengers] = useState<any[]>([]);
    const [loadingPassengers, setLoadingPassengers] = useState(false);

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

    // Fetch passengers when trip_id changes
    useEffect(() => {
        const fetchTripPassengers = async () => {
            if (!formData.trip_id) {
                setTripPassengers([]);
                return;
            }

            try {
                setLoadingPassengers(true);
                // Get passengers for this trip via trip_passengers table
                const { data, error } = await supabase
                    .from('trip_passengers')
                    .select('passenger_id, passengers(id, first_name, last_name, email)')
                    .eq('trip_id', formData.trip_id);

                if (error) throw error;

                // Format data and filter out nulls
                const formattedPassengers = data
                    ?.map((item: any) => item.passengers)
                    .filter((p: any) => p !== null) || [];

                // Sort by name
                formattedPassengers.sort((a: any, b: any) => a.first_name.localeCompare(b.first_name));

                setTripPassengers(formattedPassengers);
            } catch (err) {
                console.error("Error fetching trip passengers", err);
            } finally {
                setLoadingPassengers(false);
            }
        };

        if (isOpen) {
            fetchTripPassengers();
        }
    }, [formData.trip_id, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const voucherData = {
            title: formData.title,
            type_id: formData.type_id,
            format: formData.format,
            trip_id: (formData.assignment === 'trip' || formData.assignment === 'passenger') && formData.trip_id ? formData.trip_id : null,
            passenger_id: formData.assignment === 'passenger' && formData.passenger_id ? formData.passenger_id : null,
            provider_name: formData.provider_name || undefined,
            service_date: formData.service_date || undefined,
            external_url: formData.format === 'link' ? formData.external_url : undefined,
            visibility: formData.assignment === 'trip' ? formData.visibility : 'passenger_only', // Force passenger_only if assigned to passenger
            notes: formData.notes || undefined,
        };

        // Validation logic fix: if passenger assignment, ensure trip is selected too (as context)
        if (formData.assignment === 'passenger' && !formData.trip_id) {
            alert('Por favor selecciona un viaje para buscar al pasajero.');
            return;
        }

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
        setTripPassengers([]);
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
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">{format === 'image' ? 'Imagen' : format === 'link' ? 'Link Externo' : 'PDF'}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Assignment Section - Reordered */}
                    <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        {/* 1. Select Trip - Always First */}
                        <div>
                            <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                                Viaje *
                            </label>
                            <select
                                value={formData.trip_id}
                                onChange={(e) => setFormData({ ...formData, trip_id: e.target.value, passenger_id: '', assignment: 'trip' })}
                                required
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Seleccionar viaje</option>
                                {trips.map((trip: any) => (
                                    <option key={trip.id} value={trip.id}>
                                        {trip.name} - {trip.destination}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Assignment Type (Only if trip is selected, or force selection) */}
                        {formData.trip_id && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                                    ¿A quién aplica? *
                                </label>
                                <div className="flex gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="assignment"
                                            value="trip"
                                            checked={formData.assignment === 'trip'}
                                            onChange={() => setFormData({ ...formData, assignment: 'trip', passenger_id: '' })}
                                            className="w-4 h-4 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Todo el grupo</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="assignment"
                                            value="passenger"
                                            checked={formData.assignment === 'passenger'}
                                            onChange={() => setFormData({ ...formData, assignment: 'passenger' })}
                                            className="w-4 h-4 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Pasajero específico</span>
                                    </label>
                                </div>

                                {/* 3. Select Passenger (Only if assignment is passenger) */}
                                {formData.assignment === 'passenger' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-3">
                                        <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                                            Seleccionar Pasajero *
                                        </label>
                                        <select
                                            value={formData.passenger_id}
                                            onChange={(e) => setFormData({ ...formData, passenger_id: e.target.value })}
                                            required
                                            disabled={loadingPassengers}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                        >
                                            <option value="">
                                                {loadingPassengers ? 'Cargando pasajeros...' : 'Seleccionar pasajero del viaje'}
                                            </option>
                                            {tripPassengers.map((passenger: any) => (
                                                <option key={passenger.id} value={passenger.id}>
                                                    {passenger.first_name} {passenger.last_name} ({passenger.email || 'Sin email'})
                                                </option>
                                            ))}
                                        </select>
                                        {tripPassengers.length === 0 && !loadingPassengers && (
                                            <p className="text-xs text-orange-500 mt-1">
                                                Este viaje no tiene pasajeros asignados aún o no se pudieron cargar.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Visibility (only for trip assignment) */}
                    {formData.assignment === 'trip' && formData.trip_id && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-semibold text-triex-grey dark:text-white mb-2">
                                Visibilidad
                            </label>
                            <select
                                value={formData.visibility}
                                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="all_trip_passengers">Todos los pasajeros del viaje pueden verlo</option>
                                <option value="passenger_only">Solo visible para administradores (Oculto)</option>
                            </select>
                            <p className="text-xs text-zinc-500 mt-1">Define quién puede ver este voucher en la app.</p>
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
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        if (file.size > 5 * 1024 * 1024) {
                                            alert("El archivo es demasiado grande. El tamaño máximo permitido es 5MB.");
                                            e.target.value = "";
                                            setFile(null);
                                            return;
                                        }
                                        setFile(file);
                                    } else {
                                        setFile(null);
                                    }
                                }}
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
