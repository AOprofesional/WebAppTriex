import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrangePass } from '../hooks/useOrangePass';

interface PassengerData {
    id: string;
    first_name: string | null;
    last_name: string | null;
    passenger_email: string | null;
    phone: string | null;
    document_type: string | null;
    document_number: string | null;
    type_code: string | null;  // From view
    passenger_type_id: number | null;  // For updates
    is_recurrent: boolean | null;
    referred_by_passenger_id?: string | null; // Optional, might need fetching
}

interface EditPassengerModalProps {
    passenger: PassengerData | null;
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
    const { validateReferralCode } = useOrangePass();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        document_type: 'DNI',
        document_number: '',
        passenger_type_id: 1 as number,  // 1 = regular
        is_recurrent: false,
        referral_code: '',
        referred_by_passenger_id: null as string | null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);
    const [validatingCode, setValidatingCode] = useState(false);
    const [referrerName, setReferrerName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (passenger) {
            // Map type_code to passenger_type_id
            const typeCodeToId: { [key: string]: number } = {
                'regular': 1,
                'vip': 2,
                'corporate': 3,
                'other': 4
            };

            // Fetch current referral info if missing
            const fetchReferralInfo = async () => {
                const { data } = await supabase
                    .from('passengers')
                    .select('referred_by_passenger_id, referred_by_code_raw')
                    .eq('id', passenger.id)
                    .single();

                if (data?.referred_by_passenger_id) {
                    setFormData(prev => ({
                        ...prev,
                        referred_by_passenger_id: data.referred_by_passenger_id,
                        // Ideally trigger a lookup for the code/name if needed, but for now just ID
                    }));
                    // Fetch referrer name for display
                    const { data: referrer } = await supabase
                        .from('passengers')
                        .select('first_name, last_name, orange_referral_code')
                        .eq('id', data.referred_by_passenger_id)
                        .single();

                    if (referrer) {
                        setReferrerName(`${referrer.first_name} ${referrer.last_name}`);
                        setFormData(prev => ({
                            ...prev,
                            referral_code: referrer.orange_referral_code || ''
                        }));
                        setReferralCodeValid(true);
                    }
                } else if (data?.referred_by_code_raw) {
                    setFormData(prev => ({ ...prev, referral_code: data.referred_by_code_raw || '' }));
                }
            };

            fetchReferralInfo();

            setFormData({
                first_name: passenger.first_name || '',
                last_name: passenger.last_name || '',
                email: passenger.passenger_email || '',
                phone: passenger.phone || '',
                document_type: passenger.document_type || 'DNI',
                document_number: passenger.document_number || '',
                passenger_type_id: typeCodeToId[passenger.type_code || 'regular'] || 1,
                is_recurrent: passenger.is_recurrent || false,
                referral_code: '', // Will be populated by fetchReferralInfo
                referred_by_passenger_id: null,
            });
            setReferrerName(null);
            setReferralCodeValid(null);
        }
    }, [passenger]);

    const handleReferralCodeBlur = async () => {
        if (!formData.referral_code) {
            setReferralCodeValid(null);
            setReferrerName(null);
            setFormData(prev => ({ ...prev, referred_by_passenger_id: null }));
            return;
        }

        setValidatingCode(true);
        const referrer = await validateReferralCode(formData.referral_code);
        setValidatingCode(false);

        if (referrer) {
            // Prevent self-referral
            if (referrer.id === passenger?.id) {
                setReferralCodeValid(false);
                setReferrerName(null);
                setFormData(prev => ({ ...prev, referred_by_passenger_id: null }));
                setError("No se puede autoreferir");
                return;
            }
            setReferralCodeValid(true);
            setReferrerName(`${referrer.first_name} ${referrer.last_name}`);
            setFormData(prev => ({ ...prev, referred_by_passenger_id: referrer.id }));
            setError(null);
        } else {
            setReferralCodeValid(false);
            setReferrerName(null);
            setFormData(prev => ({ ...prev, referred_by_passenger_id: null }));
        }
    };

    if (!isOpen || !passenger) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const updates: any = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone || null,
                document_type: formData.document_type,
                document_number: formData.document_number || null,
                passenger_type_id: formData.passenger_type_id,
                is_recurrent: formData.is_recurrent,
                referred_by_code_raw: formData.referral_code || null,
            };

            // Only update referral link if valid code is present and different
            if (formData.referred_by_passenger_id) {
                updates.referred_by_passenger_id = formData.referred_by_passenger_id;
                // We might want to set referral_linked_at if it wasn't set before
                if (referralCodeValid) {
                    updates.referral_linked_at = new Date().toISOString();
                }
            } else if (!formData.referral_code) {
                // Clear referral if code is cleared? Strategy decision:
                // Usually we don't clear deep links unless explicitly requested.
                // But here if they clear the code, maybe we should clear the link.
                updates.referred_by_passenger_id = null;
                updates.referral_linked_at = null;
            }

            const { error: updateError } = await supabase
                .from('passengers')
                .update(updates)
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
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                            value={formData.passenger_type_id}
                            onChange={(e) => setFormData({ ...formData, passenger_type_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="1">Regular</option>
                            <option value="2">VIP</option>
                            <option value="3">Corporativo</option>
                            <option value="4">Otro</option>
                        </select>
                    </div>

                    {/* Referral Code (Orange Pass) */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                            Código de Referido (Orange Pass)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.referral_code}
                                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                                onBlur={handleReferralCodeBlur}
                                className={`w-full px-4 py-2.5 pr-10 bg-zinc-50 dark:bg-zinc-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase ${referralCodeValid === true ? 'border-green-500' :
                                        referralCodeValid === false ? 'border-red-500' :
                                            'border-zinc-200 dark:border-zinc-700'
                                    } focus:border-primary`}
                                placeholder="Ingresa código de referido"
                                maxLength={8}
                                disabled={validatingCode}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                {validatingCode && (
                                    <span className="material-symbols-outlined animate-spin text-zinc-400">refresh</span>
                                )}
                                {!validatingCode && referralCodeValid === true && (
                                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                                )}
                                {!validatingCode && referralCodeValid === false && (
                                    <span className="material-symbols-outlined text-red-500">error</span>
                                )}
                            </div>
                        </div>
                        {referrerName && (
                            <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">handshake</span>
                                Referido por: {referrerName}
                            </p>
                        )}
                        {!referrerName && referralCodeValid === false && (
                            <p className="mt-1 text-xs text-red-500 font-medium">
                                Código inválido o no encontrado
                            </p>
                        )}
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
