
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTrips } from '../../hooks/useTrips';
import { useItineraryDays, ItineraryDay } from '../../hooks/useItineraryDays';
import { useItineraryItems, ItineraryItem } from '../../hooks/useItineraryItems';
import { supabase } from '../../lib/supabase';
import { NextStepCard } from '../../components/NextStepCard';
import { ActivityModal } from '../../components/ActivityModal';

interface TripFormData {
    name: string;
    internal_code: string;
    destination: string;
    start_date: string;
    end_date: string;
    trip_type: string;
    brand_sub: string;
    status_commercial: string;
    general_itinerary: string;
    includes_text: string;
    excludes_text: string;
    coordinator_name: string;
    coordinator_phone: string;
    coordinator_email: string;
    emergency_contact: string;
    next_step_override_enabled: boolean;
    next_step_type_override: string;
    next_step_title_override: string;
    next_step_detail_override: string;
    next_step_cta_label_override: string;
    next_step_cta_route_override: string;
}

interface Passenger {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export const TripForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { createTrip, updateTrip, getTripById, assignPassengers } = useTrips();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // All passengers for selection
    const [allPassengers, setAllPassengers] = useState<Passenger[]>([]);
    const [passengerSearch, setPassengerSearch] = useState('');
    const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);

    // Detailed Itinerary
    const { days, fetchDays, addDay, updateDay, deleteDay } = useItineraryDays(id || null);
    const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
    const { items, fetchItems, addItem, updateItem, deleteItem, moveItem } = useItineraryItems(selectedDayId);
    const [activityModal, setActivityModal] = useState<{ isOpen: boolean; activity?: ItineraryItem | null }>({
        isOpen: false,
        activity: null,
    });

    // Form data
    const [formData, setFormData] = useState<TripFormData>({
        name: '',
        internal_code: '',
        destination: '',
        start_date: '',
        end_date: '',
        trip_type: 'EGRESADOS',
        brand_sub: 'Triex Egresados',
        status_commercial: 'CON_CUPO',
        general_itinerary: '',
        includes_text: '',
        excludes_text: '',
        coordinator_name: '',
        coordinator_phone: '',
        coordinator_email: '',
        emergency_contact: '',
        next_step_override_enabled: false,
        next_step_type_override: 'INFO',
        next_step_title_override: '',
        next_step_detail_override: '',
        next_step_cta_label_override: '',
        next_step_cta_route_override: '',
    });

    // Load trip data if editing
    useEffect(() => {
        if (id) {
            loadTripData();
            fetchDays();
        }
        loadPassengers();
    }, [id]);

    // Auto-select first day when days load
    useEffect(() => {
        if (days.length > 0 && !selectedDayId) {
            setSelectedDayId(days[0].id);
        }
    }, [days]);

    const loadTripData = async () => {
        setLoading(true);
        const { data, error } = await getTripById(id!);

        if (error) {
            alert('Error al cargar viaje: ' + error);
            navigate('/admin/trips');
            return;
        }

        if (data) {
            setFormData({
                name: data.name || '',
                internal_code: data.internal_code || '',
                destination: data.destination || '',
                start_date: data.start_date || '',
                end_date: data.end_date || '',
                trip_type: data.trip_type || 'EGRESADOS',
                brand_sub: data.brand_sub || 'Triex Egresados',
                status_commercial: data.status_commercial || 'CON_CUPO',
                general_itinerary: data.general_itinerary || '',
                includes_text: data.includes_text || '',
                excludes_text: data.excludes_text || '',
                coordinator_name: data.coordinator_name || '',
                coordinator_phone: data.coordinator_phone || '',
                coordinator_email: data.coordinator_email || '',
                emergency_contact: data.emergency_contact || '',
                next_step_override_enabled: data.next_step_override_enabled || false,
                next_step_type_override: data.next_step_type_override || 'INFO',
                next_step_title_override: data.next_step_title_override || '',
                next_step_detail_override: data.next_step_detail_override || '',
                next_step_cta_label_override: data.next_step_cta_label_override || '',
                next_step_cta_route_override: data.next_step_cta_route_override || '',
            });

            // Load assigned passengers
            const { data: tripPassengers } = await supabase
                .from('trip_passengers')
                .select('passenger_id')
                .eq('trip_id', id!);

            if (tripPassengers) {
                setSelectedPassengers(tripPassengers.map(tp => tp.passenger_id));
            }
        }

        setLoading(false);
    };

    const loadPassengers = async () => {
        const { data } = await supabase
            .from('passengers')
            .select('id, first_name, last_name, email')
            .is('archived_at', null)
            .order('last_name', { ascending: true });

        if (data) {
            setAllPassengers(data);
        }
    };

    const handleInputChange = (field: keyof TripFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
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

        if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
        if (!formData.destination.trim()) newErrors.destination = 'El destino es obligatorio';
        if (!formData.start_date) newErrors.start_date = 'La fecha de inicio es obligatoria';
        if (!formData.end_date) newErrors.end_date = 'La fecha de fin es obligatoria';

        if (formData.start_date && formData.end_date) {
            if (new Date(formData.start_date) > new Date(formData.end_date)) {
                newErrors.end_date = 'La fecha de fin debe ser posterior a la de inicio';
            }
        }

        if (formData.next_step_override_enabled) {
            if (!formData.next_step_title_override.trim()) {
                newErrors.next_step_title_override = 'El título es obligatorio';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveTrip = async (redirectToList: boolean = true): Promise<string | null> => {
        if (!validate()) {
            alert('Por favor corrige los errores del formulario');
            return null;
        }

        setSaving(true);

        try {
            const tripData: any = { ...formData };

            let tripId: string;

            if (id) {
                // Update existing trip
                const { data, error } = await updateTrip(id, tripData);
                if (error) throw new Error(error);
                tripId = id;
            } else {
                // Create new trip
                const { data, error } = await createTrip(tripData);
                if (error) throw new Error(error);
                if (!data) throw new Error('No se pudo crear el viaje');
                tripId = data.id;
            }

            // Assign passengers
            if (selectedPassengers.length > 0) {
                const { error: assignError } = await assignPassengers(tripId, selectedPassengers);
                if (assignError) {
                    console.warn('Error assigning passengers:', assignError);
                }
            }

            if (redirectToList) {
                navigate('/admin/trips');
            } else {
                // If not redirecting to list, we update title or just return id
                // But since we are likely moving from "new" to "edit", we should navigate to the edit URL
                if (!id) {
                    navigate(`/admin/trips/${tripId}`, { replace: true });
                }
            }

            return tripId;

        } catch (error: any) {
            alert('Error al guardar viaje: ' + error.message);
            return null;
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveTrip(true);
    };

    const calculateAutoStatus = (): string => {
        if (!formData.start_date || !formData.end_date) return 'PREVIO';

        const today = new Date().toISOString().split('T')[0];
        const start = formData.start_date;
        const end = formData.end_date;

        if (today >= start && today <= end) return 'EN_CURSO';
        if (today < start) return 'PREVIO';
        return 'FINALIZADO';
    };

    const filteredPassengers = allPassengers.filter(p =>
        `${p.first_name} ${p.last_name} ${p.email}`
            .toLowerCase()
            .includes(passengerSearch.toLowerCase())
    );

    const togglePassenger = (passengerId: string) => {
        setSelectedPassengers(prev =>
            prev.includes(passengerId)
                ? prev.filter(id => id !== passengerId)
                : [...prev, passengerId]
        );
    };

    // Itinerary Handlers
    const handleAddDay = async () => {
        if (!id) {
            if (confirm('Para agregar días al itinerario, primero debes guardar el viaje. ¿Deseas guardarlo ahora?')) {
                const newId = await saveTrip(false);
                // After navigation to edit mode, the user can click add again.
                // We could auto-trigger it but standard page reload is safer/simpler.
            }
            return;
        }

        const result = await addDay();
        if (!result.error && result.data) {
            setSelectedDayId(result.data.id);
        }
    };

    const handleDeleteDay = async (dayId: string) => {
        if (!confirm('¿Eliminar este día del itinerario?')) return;

        const result = await deleteDay(dayId);
        if (!result.error) {
            if (selectedDayId === dayId) {
                setSelectedDayId(days.length > 1 ? days[0].id : null);
            }
        }
    };

    const handleSaveActivity = async (activityData: Partial<ItineraryItem>) => {
        if (!id || !selectedDayId) return;

        if (activityModal.activity) {
            // Update existing
            await updateItem(activityModal.activity.id, activityData);
        } else {
            // Create new
            await addItem(id, activityData);
        }
    };

    const handleDeleteActivity = async (itemId: string) => {
        if (!confirm('¿Eliminar esta actividad?')) return;
        await deleteItem(itemId);
    };

    const handleMoveActivity = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        await moveItem(index, targetIndex);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-zinc-500">Cargando viaje...</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-triex-grey dark:text-white">
                        {id ? 'Editar Viaje' : 'Nuevo Viaje'}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {id ? 'Modifica los detalles del viaje' : 'Completa los detalles del nuevo viaje'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/admin/trips')}
                    className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                    Cancelar
                </button>
            </div>

            {/* Section A: Datos Básicos */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-triex-grey dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span>
                    Datos Básicos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Nombre del viaje *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${errors.name ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                            placeholder="Ej: Egresados 2026 - Cancún"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Código interno
                        </label>
                        <input
                            type="text"
                            value={formData.internal_code}
                            onChange={(e) => handleInputChange('internal_code', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                            placeholder="TR2026CUN"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Destino *
                        </label>
                        <input
                            type="text"
                            value={formData.destination}
                            onChange={(e) => handleInputChange('destination', e.target.value)}
                            className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${errors.destination ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                            placeholder="Cancún, México"
                        />
                        {errors.destination && <p className="mt-1 text-sm text-red-500">{errors.destination}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Fecha de inicio *
                        </label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => handleInputChange('start_date', e.target.value)}
                            className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${errors.start_date ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                        />
                        {errors.start_date && <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Fecha de fin *
                        </label>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => handleInputChange('end_date', e.target.value)}
                            className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${errors.end_date ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                        />
                        {errors.end_date && <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Tipo de viaje
                        </label>
                        <select
                            value={formData.trip_type}
                            onChange={(e) => handleInputChange('trip_type', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="EGRESADOS">Egresados</option>
                            <option value="CORPORATIVO">Corporativo</option>
                            <option value="FAMILIAR">Familiar</option>
                            <option value="GRUPO">Grupo</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Submarca
                        </label>
                        <select
                            value={formData.brand_sub}
                            onChange={(e) => handleInputChange('brand_sub', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="Triex Egresados">Triex Egresados</option>
                            <option value="Triex Corporate">Triex Corporate</option>
                            <option value="Triex Familias">Triex Familias</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Section B: Estados */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-triex-grey dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">toggle_on</span>
                    Estados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Estado Comercial
                        </label>
                        <select
                            value={formData.status_commercial}
                            onChange={(e) => handleInputChange('status_commercial', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="CON_CUPO">Con Cupo</option>
                            <option value="SIN_CUPO">Sin Cupo</option>
                            <option value="CERRADO">Cerrado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Estado Operativo (automático)
                        </label>
                        <input
                            type="text"
                            value={calculateAutoStatus()}
                            disabled
                            className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 cursor-not-allowed"
                        />
                        <p className="mt-2 text-xs text-zinc-500">
                            Se calcula automáticamente según las fechas del viaje
                        </p>
                    </div>
                </div>
            </div>

            {/* Section C: Contenido Visible al Pasajero */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-triex-grey dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">visibility</span>
                    Contenido Visible al Pasajero
                </h2>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Itinerario General
                        </label>
                        <textarea
                            value={formData.general_itinerary}
                            onChange={(e) => handleInputChange('general_itinerary', e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                            placeholder="- Día 1: Salida desde Buenos Aires&#10;- Día 2: City tour en Cancún&#10;- Día 3: Playa y actividades acuáticas"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Un item por línea, usa "- " para bullets</p>
                    </div>

                    {/* Detailed Itinerary Editor */}
                    <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc800">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-triex-grey dark:text-white">
                                    Itinerario Detallado (día por día)
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Agrega días con actividades detalladas
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddDay}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Agregar día
                            </button>
                        </div>

                        {/* Day Tabs */}
                        {days.length > 0 && (
                            <div className="overflow-x-auto mb-5">
                                <div className="flex gap-2 min-w-max">
                                    {days.map((day) => (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => setSelectedDayId(day.id)}
                                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${selectedDayId === day.id
                                                ? 'bg-primary text-white'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            Día {day.day_number}
                                            {day.title && <span className="text-xs opacity-80"> - {day.title}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selected Day Content */}
                        {selectedDayId && days.find(d => d.id === selectedDayId) && (
                            <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-xl">
                                {/* Day Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                            Título del día (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={days.find(d => d.id === selectedDayId)?.title || ''}
                                            onChange={(e) => updateDay(selectedDayId, { title: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Ej: Llegada a Cancún"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                            Fecha (opcional)
                                        </label>
                                        <input
                                            type="date"
                                            value={days.find(d => d.id === selectedDayId)?.date || ''}
                                            onChange={(e) => updateDay(selectedDayId, { date: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                {/* Activities */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                            Actividades del día
                                        </h4>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setActivityModal({ isOpen: true, activity: null })}
                                                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">add</span>
                                                Actividad
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDay(selectedDayId)}
                                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                Eliminar día
                                            </button>
                                        </div>
                                    </div>

                                    {items.length === 0 ? (
                                        <p className="text-xs text-zinc-500 text-center py-8 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                                            No hay actividades. Haz clic en "+ Actividad" para agregar una.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {items.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-start gap-3"
                                                >
                                                    {/* Move buttons */}
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveActivity(index, 'up')}
                                                            disabled={index === 0}
                                                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Mover arriba"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">arrow_upward</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveActivity(index, 'down')}
                                                            disabled={index === items.length - 1}
                                                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Mover abajo"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">arrow_downward</span>
                                                        </button>
                                                    </div>

                                                    {/* Activity Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                {item.time && (
                                                                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded mb-1">
                                                                        {item.time}
                                                                    </span>
                                                                )}
                                                                <h5 className="font-bold text-sm text-triex-grey dark:text-white">
                                                                    {item.title}
                                                                </h5>
                                                                {item.description && (
                                                                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                                                                        {item.description}
                                                                    </p>
                                                                )}
                                                                {item.location_name && (
                                                                    <div className="flex items-center gap-1 mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                                                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                                                        <span>{item.location_name}</span>
                                                                    </div>
                                                                )}
                                                                {(item.instructions_url || item.instructions_text) && (
                                                                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                                                        <span className="material-symbols-outlined text-sm">info</span>
                                                                        Tiene instrucciones
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActivityModal({ isOpen: true, activity: item })}
                                                                    className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                                                    title="Editar"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteActivity(item.id)}
                                                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                    title="Eliminar"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {days.length === 0 && (
                            <p className="text-sm text-zinc-500 text-center py-8">
                                Haz clic en "Agregar día" para empezar a crear el itinerario detallado
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Incluye
                        </label>
                        <textarea
                            value={formData.includes_text}
                            onChange={(e) => handleInputChange('includes_text', e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                            placeholder="- Vuelos ida y vuelta&#10;- 7 noches de alojamiento&#10;- Desayuno incluido"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            No Incluye
                        </label>
                        <textarea
                            value={formData.excludes_text}
                            onChange={(e) => handleInputChange('excludes_text', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                            placeholder="- Comidas no especificadas&#10;- Excursiones opcionales&#10;- Gastos personales"
                        />
                    </div>
                </div>
            </div>

            {/* Section D: Contactos */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-triex-grey dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">contacts</span>
                    Contactos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Nombre coordinador
                        </label>
                        <input
                            type="text"
                            value={formData.coordinator_name}
                            onChange={(e) => handleInputChange('coordinator_name', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Juan Pérez"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Teléfono coordinador
                        </label>
                        <input
                            type="tel"
                            value={formData.coordinator_phone}
                            onChange={(e) => handleInputChange('coordinator_phone', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="+54 9 11 1234-5678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Email coordinador
                        </label>
                        <input
                            type="email"
                            value={formData.coordinator_email}
                            onChange={(e) => handleInputChange('coordinator_email', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="coordinador@triex.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Contacto de emergencia
                        </label>
                        <input
                            type="text"
                            value={formData.emergency_contact}
                            onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="911 o número 24/7"
                        />
                    </div>
                </div>
            </div>

            {/* Section E: Próximo Paso Override */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-triex-grey dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">edit_note</span>
                            Próximo Paso (Override)
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">
                            Personaliza el próximo paso o usa el cálculo automático
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.next_step_override_enabled}
                            onChange={(e) => handleInputChange('next_step_override_enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary"></div>
                    </label>
                </div>

                {formData.next_step_override_enabled && (
                    <div className="space-y-5 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Tipo de paso
                                </label>
                                <select
                                    value={formData.next_step_type_override}
                                    onChange={(e) => handleInputChange('next_step_type_override', e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="DOCS">Documentación</option>
                                    <option value="VOUCHERS">Vouchers</option>
                                    <option value="INFO">Información</option>
                                    <option value="CONTACT">Contacto</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={formData.next_step_title_override}
                                    onChange={(e) => handleInputChange('next_step_title_override', e.target.value)}
                                    className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${errors.next_step_title_override ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                                    placeholder="Urgente: Contactar coordinador"
                                />
                                {errors.next_step_title_override && <p className="mt-1 text-sm text-red-500">{errors.next_step_title_override}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                Detalle
                            </label>
                            <textarea
                                value={formData.next_step_detail_override}
                                onChange={(e) => handleInputChange('next_step_detail_override', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Hay cambios importantes en tu itinerario"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Texto del botón
                                </label>
                                <input
                                    type="text"
                                    value={formData.next_step_cta_label_override}
                                    onChange={(e) => handleInputChange('next_step_cta_label_override', e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Llamar ahora"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Ruta de navegación
                                </label>
                                <input
                                    type="text"
                                    value={formData.next_step_cta_route_override}
                                    onChange={(e) => handleInputChange('next_step_cta_route_override', e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="/mytrip, /vouchers, /upload-document"
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        {formData.next_step_title_override && (
                            <div className="mt-6 p-5 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">
                                    Vista previa para el pasajero
                                </h4>
                                <div className="scale-90 origin-top-left">
                                    <NextStepCard
                                        type={formData.next_step_type_override as any}
                                        title={formData.next_step_title_override}
                                        detail={formData.next_step_detail_override}
                                        ctaLabel={formData.next_step_cta_label_override || 'Ver más'}
                                        ctaRoute={formData.next_step_cta_route_override || '/mytrip'}
                                        onCtaClick={() => { }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Section F: Pasajeros */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-triex-grey dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">group</span>
                    Pasajeros del Viaje
                </h2>

                {/* Search */}
                <div className="relative mb-4">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar pasajeros por nombre o email..."
                        value={passengerSearch}
                        onChange={(e) => setPassengerSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                {/* Selected count */}
                <div className="mb-4 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                    {selectedPassengers.length} pasajero{selectedPassengers.length !== 1 ? 's' : ''} seleccionado{selectedPassengers.length !== 1 ? 's' : ''}
                </div>

                {/* Passenger list */}
                <div className="max-h-96 overflow-y-auto space-y-2 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-800">
                    {filteredPassengers.length === 0 ? (
                        <p className="text-center text-zinc-500 py-8">
                            {passengerSearch ? 'No se encontraron pasajeros' : 'No hay pasajeros disponibles'}
                        </p>
                    ) : (
                        filteredPassengers.map(passenger => (
                            <label
                                key={passenger.id}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedPassengers.includes(passenger.id)}
                                    onChange={() => togglePassenger(passenger.id)}
                                    className="w-5 h-5 text-primary border-zinc-300 rounded focus:ring-2 focus:ring-primary/20"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold text-triex-grey dark:text-white text-sm">
                                        {passenger.first_name} {passenger.last_name}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {passenger.email}
                                    </div>
                                </div>
                            </label>
                        ))
                    )}
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => navigate('/admin/trips')}
                    className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Guardando...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">save</span>
                            {id ? 'Guardar cambios' : 'Crear viaje'}
                        </>
                    )}
                </button>
            </div>

            {/* Activity Modal */}
            <ActivityModal
                isOpen={activityModal.isOpen}
                activity={activityModal.activity}
                onSave={handleSaveActivity}
                onClose={() => setActivityModal({ isOpen: false, activity: null })}
            />
        </form>
    );
};
