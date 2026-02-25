import React, { useState, useEffect } from 'react';
import { useCreatePassengerWithInvite } from '../hooks/useCreatePassengerWithInvite';
import { usePassengers } from '../hooks/usePassengers';
import { useOrangePass } from '../hooks/useOrangePass';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import { validateEmail, validatePhone, validateCUIL, getErrorMessage } from '../utils/validation';

interface CreatePassengerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreatePassengerModal: React.FC<CreatePassengerModalProps> = ({ isOpen, onClose }) => {
    const { createAndInvite, creating } = useCreatePassengerWithInvite();
    const { refetch } = usePassengers(); // This might refetch the main passenger list
    const { validateReferralCode } = useOrangePass();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        passenger_type_id: 1, // Regular por defecto
        birth_date: '',
        cuil: '',
        document_type: '' as 'DNI' | 'Pasaporte' | 'Otro' | '',
        document_number: '',
        trip_id: '', // New field for optional trip linking
        referral_code: '' // Orange Pass referral code
    });

    const [availableTrips, setAvailableTrips] = useState<{ id: string; name: string }[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(false);

    // Referral code validation
    const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);
    const [validatingCode, setValidatingCode] = useState(false);
    const [referrerId, setReferrerId] = useState<string | null>(null);

    // Email validation
    const [emailValidation, setEmailValidation] = useState<{
        isChecking: boolean;
        isValid: boolean | null;
        error?: string;
    }>({
        isChecking: false,
        isValid: null,
    });

    // Phone and CUIL validation errors
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [cuilError, setCuilError] = useState<string | null>(null);

    // Tabs state
    const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'orangepass'>('personal');

    // Debounced values
    const debouncedEmail = useDebounce(formData.email, 500);
    const debouncedReferralCode = useDebounce(formData.referral_code, 500);

    // Fetch trips when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchTrips();
        }
    }, [isOpen]);

    const fetchTrips = async () => {
        try {
            setLoadingTrips(true);
            const { data, error } = await supabase
                .from('trips')
                .select('id, name')
                .is('archived_at', null)
                .order('start_date', { ascending: false }); // Show newest trips first

            if (error) throw error;
            setAvailableTrips(data || []);
        } catch (err) {
            console.error('Error fetching trips:', err);
        } finally {
            setLoadingTrips(false);
        }
    };

    // Validate email uniqueness with debounce
    useEffect(() => {
        const validateEmailUnique = async () => {
            const email = debouncedEmail.trim();
            if (!email || !isOpen) {
                setEmailValidation({ isChecking: false, isValid: null });
                return;
            }

            setEmailValidation({ isChecking: true, isValid: null });

            // Validar formato primero
            const formatValidation = validateEmail(email);
            if (!formatValidation.isValid) {
                setEmailValidation({
                    isChecking: false,
                    isValid: false,
                    error: formatValidation.error
                });
                return;
            }

            // Verificar si existe en la base de datos
            try {
                const { data, error } = await supabase
                    .from('passengers')
                    .select('id')
                    .eq('email', email.toLowerCase())
                    .limit(1);

                if (error) throw error;

                if (data && data.length > 0) {
                    setEmailValidation({
                        isChecking: false,
                        isValid: false,
                        error: 'Este email ya está registrado'
                    });
                } else {
                    setEmailValidation({
                        isChecking: false,
                        isValid: true
                    });
                }
            } catch (err: any) {
                console.error('Error validating email:', err);
                setEmailValidation({
                    isChecking: false,
                    isValid: null,
                    error: 'Error al validar email'
                });
            }
        };

        validateEmailUnique();
    }, [debouncedEmail, isOpen]);

    // Validate referral code with debounce
    useEffect(() => {
        const validateCode = async () => {
            const code = debouncedReferralCode.trim();
            if (!code || !isOpen) {
                setReferralCodeValid(null);
                setReferrerId(null);
                setValidatingCode(false);
                return;
            }

            setValidatingCode(true);
            const referrer = await validateReferralCode(code);

            if (referrer) {
                setReferralCodeValid(true);
                setReferrerId(referrer.id);
            } else {
                setReferralCodeValid(false);
                setReferrerId(null);
            }
            setValidatingCode(false);
        };

        validateCode();
    }, [debouncedReferralCode, isOpen]);

    // Validate phone format
    const handlePhoneBlur = () => {
        if (!formData.phone) {
            setPhoneError(null);
            return;
        }

        const validation = validatePhone(formData.phone);
        setPhoneError(validation.isValid ? null : validation.error);
    };

    // Validate CUIL format
    const handleCuilBlur = () => {
        if (!formData.cuil) {
            setCuilError(null);
            return;
        }

        const validation = validateCUIL(formData.cuil);
        setCuilError(validation.isValid ? null : validation.error);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation & Tab switching for required fields
        if (!formData.first_name || !formData.last_name) {
            setActiveTab('personal');
            toast.error('Por favor, completa Nombre y Apellido');
            return;
        }

        if (!formData.email) {
            setActiveTab('contact');
            toast.error('Por favor, ingresa un Email');
            return;
        }

        // Validate email is unique before proceeding
        if (emailValidation.isValid === false) {
            setActiveTab('contact');
            toast.error(emailValidation.error || 'Email inválido');
            return;
        }

        // Validate phone if provided
        if (formData.phone && phoneError) {
            setActiveTab('contact');
            toast.error(phoneError);
            return;
        }

        // Validate CUIL if provided
        if (formData.cuil && cuilError) {
            setActiveTab('personal');
            toast.error(cuilError);
            return;
        }

        // 1. Validate referral code to get reliable referrerId
        let finalReferrerId: string | null = null;
        let finalReferralCode: string | null = null;

        if (formData.referral_code.trim()) {
            const referrer = await validateReferralCode(formData.referral_code.trim());
            if (referrer) {
                finalReferrerId = referrer.id;
                finalReferralCode = formData.referral_code.trim().toUpperCase();
            } else {
                // If code is invalid, ask user if they want to proceed without it?
                // For now, we'll just ignore it or alert? 
                // The UI shows "Invalid", so user likely knows. We'll proceed without it.
            }
        }

        // 2. Check if a User Profile already exists for this email
        let existingProfileId: string | undefined = undefined;
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', formData.email.trim())
                .single();

            if (profile) {
                existingProfileId = profile.id;
            }
        } catch (err) {
            // Ignore error if not found, just means user doesn't exist
        }

        // 3. Create Passenger (Atomic)
        const result = await createAndInvite({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone || undefined,
            passenger_type_id: formData.passenger_type_id,
            birth_date: formData.birth_date || undefined,
            cuil: formData.cuil || undefined,
            document_type: formData.document_type || undefined,
            document_number: formData.document_number || undefined,
            // Extended fields
            profile_id: existingProfileId,
            referred_by_passenger_id: finalReferrerId || undefined,
            referred_by_code_raw: finalReferralCode || undefined,
            referral_linked_at: finalReferralCode ? new Date().toISOString() : undefined
        });

        if (result.success && result.passenger) {
            // Link to trip if selected
            if (formData.trip_id) {
                try {
                    const { error: linkError } = await supabase
                        .from('trip_passengers')
                        .insert({
                            trip_id: formData.trip_id,
                            passenger_id: result.passenger.id
                        });

                    if (linkError) {
                        console.error('Error linking passenger to trip:', linkError);
                        toast.error(`Pasajero creado, pero error al vincular al viaje: ${linkError.message}`);
                    }
                } catch (linkErr: any) {
                    console.error('Error linking passenger to trip:', linkErr);
                    toast.error(`Pasajero creado, pero error al vincular al viaje: ${linkErr.message}`);
                }
            }

            toast.success(result.message);
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
                document_number: '',
                trip_id: '',
                referral_code: ''
            });
            setReferrerId(null);
            setReferralCodeValid(null);
            setActiveTab('personal');
        } else {
            toast.error(result.message);
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

                {/* Tabs Navigation */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 pt-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'personal'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Info Personal
                    </button>
                    <button
                        onClick={() => setActiveTab('contact')}
                        className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'contact'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Contacto y Viaje
                    </button>
                    <button
                        onClick={() => setActiveTab('orangepass')}
                        className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'orangepass'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Orange Pass
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Tab: Info Personal */}
                    <div className={`space-y-6 ${activeTab === 'personal' ? 'block' : 'hidden'}`}>
                        <div className="space-y-4">
                            <h3 className="font-bold text-zinc-800 dark:text-white">Datos Básicos</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        required={activeTab === 'personal'}
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                        placeholder="Juan"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Apellido *
                                    </label>
                                    <input
                                        type="text"
                                        required={activeTab === 'personal'}
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                        placeholder="Pérez"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Tipo de Pasajero *
                                </label>
                                <select
                                    required={activeTab === 'personal'}
                                    value={formData.passenger_type_id}
                                    onChange={(e) => setFormData({ ...formData, passenger_type_id: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                >
                                    <option value={1}>Regular</option>
                                    <option value={2}>VIP</option>
                                    <option value={3}>Corporativo</option>
                                    <option value={4}>Otro</option>
                                </select>
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
                                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
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
                                        onBlur={handleCuilBlur}
                                        className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${cuilError ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                                            } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition`}
                                        placeholder="20-12345678-9"
                                        maxLength={13}
                                    />
                                    {cuilError && (
                                        <p className="text-xs text-red-500 mt-1">{cuilError}</p>
                                    )}
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
                                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
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
                                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                        placeholder="12345678"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab: Contacto y Viaje */}
                    <div className={`space-y-6 ${activeTab === 'contact' ? 'block' : 'hidden'}`}>
                        {/* Sección: Vincular a Viaje (Nuevo) */}
                        <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-xl border border-primary/20">
                            <label className="block text-sm font-bold text-primary dark:text-primary mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">airplane_ticket</span>
                                Vincular a un Viaje (Opcional)
                            </label>
                            <select
                                value={formData.trip_id}
                                onChange={(e) => setFormData({ ...formData, trip_id: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            >
                                <option value="">-- No vincular a ningún viaje --</option>
                                {loadingTrips ? (
                                    <option disabled>Cargando viajes...</option>
                                ) : (
                                    availableTrips.map(trip => (
                                        <option key={trip.id} value={trip.id}>{trip.name}</option>
                                    ))
                                )}
                            </select>
                            <p className="text-xs text-zinc-500 mt-2">
                                Si seleccionas un viaje, el pasajero se agregará automáticamente a la lista de ese viaje.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="font-bold text-zinc-800 dark:text-white">Contacto</h3>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Email * <span className="text-xs text-zinc-500">(Se enviará invitación a este email)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required={activeTab === 'contact'}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full px-4 py-2.5 pr-10 bg-zinc-50 dark:bg-zinc-800/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${emailValidation.isValid === false ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
                                            emailValidation.isValid === true ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                                                'border-zinc-200 dark:border-zinc-700'
                                            }`}
                                        placeholder="juan.perez@example.com"
                                    />
                                    {emailValidation.isChecking && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                        </div>
                                    )}
                                    {!emailValidation.isChecking && emailValidation.isValid === true && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <span className="material-symbols-outlined text-green-600 text-xl">check_circle</span>
                                        </div>
                                    )}
                                    {!emailValidation.isChecking && emailValidation.isValid === false && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <span className="material-symbols-outlined text-red-600 text-xl">cancel</span>
                                        </div>
                                    )}
                                </div>
                                {emailValidation.error && (
                                    <p className="text-xs text-red-500 mt-1">{emailValidation.error}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    onBlur={handlePhoneBlur}
                                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${phoneError ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                                        } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition`}
                                    placeholder="+54 9 11 1234-5678"
                                />
                                {phoneError && (
                                    <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab: Orange Pass */}
                    <div className={`${activeTab === 'orangepass' ? 'block' : 'hidden'}`}>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-xl border border-orange-200 dark:border-orange-800 h-full">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 bg-orange-100 dark:bg-orange-800/50 rounded-lg shrink-0">
                                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">group_add</span>
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-orange-800 dark:text-orange-300 mb-1 flex items-center gap-2">
                                        Orange Pass / Referidos
                                    </label>
                                    <p className="text-sm text-orange-700 dark:text-orange-400">
                                        ⚠️ Asegúrate de verificar con el pasajero si fue referido por alguien antes de crearlo para no perder los puntos.
                                    </p>
                                </div>
                            </div>

                            <div className="relative mt-2">
                                <input
                                    type="text"
                                    value={formData.referral_code}
                                    onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                                    className={`w-full px-4 py-3 pr-10 bg-white dark:bg-zinc-800 border rounded-xl text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/30 uppercase transition shadow-sm ${referralCodeValid === true ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                                        referralCodeValid === false ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
                                            'border-orange-300 dark:border-orange-700'
                                        } focus:border-orange-500`}
                                    placeholder="Ingresa código ej: ABC123XY"
                                    maxLength={8}
                                    disabled={validatingCode}
                                />
                                {validatingCode && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
                                    </div>
                                )}
                                {referralCodeValid === true && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                                    </div>
                                )}
                                {referralCodeValid === false && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <span className="material-symbols-outlined text-red-600 text-2xl">cancel</span>
                                    </div>
                                )}
                            </div>

                            {referralCodeValid === true && (
                                <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700 transition-all animate-in fade-in slide-in-from-top-2">
                                    <p className="text-sm text-green-800 dark:text-green-300 font-semibold flex items-center gap-2">
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Código válido - Este pasajero será referido y el referidor recibirá puntos cuando confirme su primer viaje
                                    </p>
                                </div>
                            )}
                            {referralCodeValid === false && (
                                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700 transition-all animate-in fade-in slide-in-from-top-2">
                                    <p className="text-sm text-red-800 dark:text-red-300 font-semibold flex items-center gap-2">
                                        <span className="material-symbols-outlined">cancel</span>
                                        Código inválido - El pasajero se creará sin referido
                                    </p>
                                </div>
                            )}
                            {!formData.referral_code && (
                                <p className="mt-3 text-sm text-orange-600 dark:text-orange-400 font-medium ml-1">
                                    Si fue referido, ingresa el código de 8 caracteres.
                                </p>
                            )}
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
