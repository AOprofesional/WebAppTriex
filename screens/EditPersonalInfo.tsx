import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePassenger, Passenger } from '../hooks/usePassenger';
import { PageLoading } from '../components/PageLoading';
import { useToast } from '../components/Toast';
import { validateCUIL, formatCUIL, validatePhone, validateBirthDate, getMaxBirthDate } from '../utils/validation';

export const EditPersonalInfo: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { passenger, loading, updateProfile } = usePassenger();
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isModified, setIsModified] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        birth_date: '',
        document_type: 'DNI',
        document_number: '',
        cuil: '',
    });

    const [initialData, setInitialData] = useState(formData);

    useEffect(() => {
        if (passenger) {
            const data = {
                first_name: passenger.first_name || '',
                last_name: passenger.last_name || '',
                phone: passenger.phone || '',
                birth_date: passenger.birth_date || '',
                document_type: passenger.document_type || 'DNI',
                document_number: passenger.document_number || '',
                cuil: passenger.cuil || '',
            };
            setFormData(data);
            setInitialData(data);
        }
    }, [passenger]);

    // Check if form has been modified
    useEffect(() => {
        const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
        setIsModified(hasChanges);
    }, [formData, initialData]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'El nombre es obligatorio';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'El apellido es obligatorio';
        }

        // Validate phone
        const phoneValidation = validatePhone(formData.phone);
        if (!phoneValidation.isValid) {
            newErrors.phone = phoneValidation.error || 'Teléfono inválido';
        }

        // Validate birth date
        const birthDateValidation = validateBirthDate(formData.birth_date);
        if (!birthDateValidation.isValid) {
            newErrors.birth_date = birthDateValidation.error || 'Fecha de nacimiento inválida';
        }

        // Validate CUIL
        const cuilValidation = validateCUIL(formData.cuil);
        if (!cuilValidation.isValid) {
            newErrors.cuil = cuilValidation.error || 'CUIL inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            toast.error('Error de validación', 'Por favor corrigé los errores antes de guardar');
            return;
        }

        setSaving(true);
        try {
            await updateProfile(formData as Partial<Passenger>);
            toast.success('¡Perfil actualizado!', 'Tus datos se guardaron correctamente');
            navigate('/profile');
        } catch (error: any) {
            toast.error('Error al guardar', error.message || 'Ocurrió un error inesperado');
        } finally {
            setSaving(false);
        }
    };

    const handleCUILChange = (value: string) => {
        const formatted = formatCUIL(value);
        setFormData({ ...formData, cuil: formatted });
    };

    if (loading) {
        return <PageLoading message="Cargando información..." />;
    }

    return (
        <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-20">
            <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-zinc-950 sticky top-0 z-50 border-b border-zinc-100 dark:border-zinc-800">
                <button
                    onClick={() => navigate(-1)}
                    disabled={saving}
                    className="p-1 -ml-1 text-zinc-800 dark:text-zinc-200"
                >
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </button>
                <h1 className="text-lg font-bold text-zinc-800 dark:text-white">
                    Información Personal
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving || !isModified}
                    className="text-primary font-bold text-[15px] disabled:opacity-50 flex items-center gap-1"
                >
                    {isModified && <span className="w-2 h-2 bg-primary rounded-full"></span>}
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>

            {/* Form */}
            <div className="px-5 py-6 space-y-6">
                {/* Email (Read-only) */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl mt-0.5">
                            info
                        </span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Email: {passenger?.email}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                El email no puede modificarse desde aquí. Contactá a tu coordinador si necesitás cambiarlo.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nombre */}
                <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        Nombre *
                    </label>
                    <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white"
                        placeholder="Tu nombre"
                    />
                    {errors.first_name && (
                        <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
                    )}
                </div>

                {/* Apellido */}
                <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        Apellido *
                    </label>
                    <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white"
                        placeholder="Tu apellido"
                    />
                    {errors.last_name && (
                        <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
                    )}
                </div>

                {/* Teléfono */}
                <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        Teléfono
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white"
                        placeholder="11 1234 5678"
                    />
                    {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                    )}
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        Fecha de Nacimiento
                    </label>
                    <input
                        type="date"
                        value={formData.birth_date}
                        max={getMaxBirthDate()}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white"
                    />
                    {errors.birth_date && (
                        <p className="text-sm text-red-500 mt-1">{errors.birth_date}</p>
                    )}
                </div>

                {/* Tipo de Documento */}
                <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        Tipo de Documento
                    </label>
                    <select
                        value={formData.document_type}
                        onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white"
                    >
                        <option value="DNI">DNI</option>
                        <option value="Pasaporte">Pasaporte</option>
                        <option value="LC">Libreta Cívica</option>
                        <option value="LE">Libreta de Enrolamiento</option>
                    </select>
                </div>

                {/* Número de Documento */}
                <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        Número de Documento
                    </label>
                    <input
                        type="text"
                        value={formData.document_number}
                        onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white"
                        placeholder="12345678"
                    />
                </div>

                {/* CUIL */}
                <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        CUIL (Opcional)
                    </label>
                    <input
                        type="text"
                        value={formData.cuil}
                        onChange={(e) => handleCUILChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-900 dark:text-white"
                        placeholder="20-12345678-9"
                        maxLength={13}
                    />
                    {errors.cuil && (
                        <p className="text-sm text-red-500 mt-1">{errors.cuil}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
