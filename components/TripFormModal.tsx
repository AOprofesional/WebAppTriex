import React, { useState, useEffect, useRef } from 'react';
import { useTrips } from '../hooks/useTrips';
import { useItineraryDays, ItineraryDay } from '../hooks/useItineraryDays';
import { useItineraryItems, ItineraryItem } from '../hooks/useItineraryItems';
import { useDocuments } from '../hooks/useDocuments';
import { supabase } from '../lib/supabase';
import { NextStepCard } from './NextStepCard';
import { ActivityModal } from './ActivityModal';
import { uploadTripBanner, deleteTripBanner, validateImageFile } from '../utils/imageUpload';

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
    trip_category: string;
}

interface Passenger {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface TripFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId?: string | null;
}

type TabType = 'general' | 'itinerary' | 'settings';

export const TripFormModal: React.FC<TripFormModalProps> = ({ isOpen, onClose, tripId }) => {
    const { createTrip, updateTrip, getTripById, assignPassengers } = useTrips();
    const {
        fetchRequiredDocuments,
        fetchPassengerDocuments,
        requiredDocuments,
        passengerDocuments
    } = useDocuments();

    const [activeTab, setActiveTab] = useState<TabType>('general');
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        if (isOpen && activeTab) {
            const currentTabElement = tabRefs.current[activeTab];
            const container = tabsContainerRef.current;
            if (currentTabElement && container) {
                const tabRect = currentTabElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                const scrollLeft = container.scrollLeft + (tabRect.left - containerRect.left) - (containerRect.width / 2) + (tabRect.width / 2);

                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeTab, isOpen]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Banner image state
    const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // All passengers for selection
    const [allPassengers, setAllPassengers] = useState<Passenger[]>([]);
    const [passengerSearch, setPassengerSearch] = useState('');
    const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);

    // Detailed Itinerary
    const { days, fetchDays, addDay, updateDay, deleteDay } = useItineraryDays(tripId || null);
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
        status_commercial: 'ABIERTO',
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
        trip_category: 'OTRO',
    });

    // Load trip data if editing
    useEffect(() => {
        if (isOpen) {
            setActiveTab('general');
            if (tripId) {
                loadTripData();
                fetchDays();
                fetchRequiredDocuments(tripId);
                fetchPassengerDocuments({ tripId: tripId });
            } else {
                // Reset form for new trip
                setFormData({
                    name: '',
                    internal_code: '',
                    destination: '',
                    start_date: '',
                    end_date: '',
                    trip_type: 'EGRESADOS',
                    brand_sub: 'Triex Egresados',
                    status_commercial: 'ABIERTO',
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
                    trip_category: 'OTRO',
                });
                setCurrentBannerUrl(null);
                setBannerFile(null);
                setBannerPreview(null);
                setSelectedPassengers([]);
                setErrors({});
            }
            loadPassengers();
        }
    }, [isOpen, tripId]); // Removed `fetchRequiredDocuments, fetchPassengerDocuments, loadPassengers` form deps to avoid re-renders loop if they change reference. Actually better to use memoization if needed, but it's safe to run on isOpen/tripId changes.

    // Auto-select first day when days load
    useEffect(() => {
        if (days.length > 0 && !selectedDayId) {
            setSelectedDayId(days[0].id);
        }
    }, [days, selectedDayId]);

    const loadTripData = async () => {
        setLoading(true);
        const { data, error } = await getTripById(tripId!);

        if (error) {
            alert('Error al cargar viaje: ' + error);
            onClose();
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
                status_commercial: data.status_commercial || 'ABIERTO',
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
                trip_category: data.trip_category || 'OTRO',
            });

            if (data.banner_image_url) {
                setCurrentBannerUrl(data.banner_image_url);
            }

            const { data: tripPassengers } = await supabase
                .from('trip_passengers')
                .select('passenger_id')
                .eq('trip_id', tripId!);

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
        let firstErrorTab: TabType | null = null;

        if (!formData.name.trim()) { newErrors.name = 'El nombre es obligatorio'; firstErrorTab = firstErrorTab || 'general'; }
        if (!formData.destination.trim()) { newErrors.destination = 'El destino es obligatorio'; firstErrorTab = firstErrorTab || 'general'; }
        if (!formData.start_date) { newErrors.start_date = 'La fecha de inicio es obligatoria'; firstErrorTab = firstErrorTab || 'general'; }
        if (!formData.end_date) { newErrors.end_date = 'La fecha de fin es obligatoria'; firstErrorTab = firstErrorTab || 'general'; }

        if (formData.start_date && formData.end_date) {
            if (new Date(formData.start_date) > new Date(formData.end_date)) {
                newErrors.end_date = 'La fecha de fin debe ser posterior a la de inicio';
                firstErrorTab = firstErrorTab || 'general';
            }
        }

        if (formData.next_step_override_enabled) {
            if (!formData.next_step_title_override.trim()) {
                newErrors.next_step_title_override = 'El título es obligatorio';
                firstErrorTab = firstErrorTab || 'settings';
            }
        }

        setErrors(newErrors);

        if (firstErrorTab) {
            setActiveTab(firstErrorTab);
            return false;
        }

        return true;
    };

    const saveTrip = async (): Promise<string | null> => {
        if (!validate()) {
            return null;
        }

        setSaving(true);
        try {
            const tripData: any = { ...formData };
            let currentTripId: string;

            if (tripId) {
                const { error } = await updateTrip(tripId, tripData);
                if (error) throw new Error(error);
                currentTripId = tripId;
            } else {
                const { data, error } = await createTrip(tripData);
                if (error) throw new Error(error);
                if (!data) throw new Error('No se pudo crear el viaje');
                currentTripId = data.id;
            }

            if (bannerFile) {
                if (currentBannerUrl) {
                    try {
                        await deleteTripBanner(currentBannerUrl);
                    } catch (err) {
                        console.warn('Could not delete old banner:', err);
                    }
                }
                const bannerUrl = await uploadTripBanner(bannerFile, currentTripId);
                await supabase.from('trips').update({ banner_image_url: bannerUrl }).eq('id', currentTripId);
            }

            if (selectedPassengers.length > 0) {
                const { error: assignError } = await assignPassengers(currentTripId, selectedPassengers);
                if (assignError) {
                    console.warn('Error assigning passengers:', assignError);
                }
            }

            onClose();
            return currentTripId;
        } catch (error: any) {
            alert('Error al guardar viaje: ' + error.message);
            return null;
        } finally {
            setSaving(false);
        }
    };

    const saveTripNoClose = async (): Promise<string | null> => {
        if (!validate()) {
            return null;
        }

        setSaving(true);
        try {
            const tripData: any = { ...formData };
            let currentTripId: string;

            if (tripId) {
                const { error } = await updateTrip(tripId, tripData);
                if (error) throw new Error(error);
                currentTripId = tripId;
            } else {
                const { data, error } = await createTrip(tripData);
                if (error) throw new Error(error);
                if (!data) throw new Error('No se pudo crear el viaje');
                currentTripId = data.id;
            }

            if (bannerFile) {
                if (currentBannerUrl) {
                    try {
                        await deleteTripBanner(currentBannerUrl);
                    } catch (err) {
                        console.warn('Could not delete old banner:', err);
                    }
                }
                const bannerUrl = await uploadTripBanner(bannerFile, currentTripId);
                await supabase.from('trips').update({ banner_image_url: bannerUrl }).eq('id', currentTripId);
                setCurrentBannerUrl(bannerUrl);
                setBannerFile(null);
                setBannerPreview(null);
            }

            return currentTripId;
        } catch (error: any) {
            alert('Error al guardar viaje: ' + error.message);
            return null;
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveTrip();
    };

    const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        setBannerFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setBannerPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveBanner = () => {
        setBannerFile(null);
        setBannerPreview(null);
        setCurrentBannerUrl(null);
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

    const handleAddDay = async () => {
        if (!tripId) {
            if (confirm('Para agregar días al itinerario, primero debes guardar el viaje. ¿Deseas guardarlo ahora?')) {
                const newId = await saveTripNoClose();
                if (newId) {
                    // Update behavior so it can fetch by the new ID? 
                    // To handle this properly, the parent component needs to know about the new ID, but here we are in a modal. 
                    // Best practice is to close modal and maybe tell parent to reopen it with the new ID, 
                    // or we tell the user to manually edit the created trip for detailed itineraries.
                    alert('Viaje guardado. Por favor, cierra este modal y edita el viaje para agregar días o recarga.');
                }
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
        if (!tripId || !selectedDayId) return;

        if (activityModal.activity) {
            await updateItem(activityModal.activity.id, activityData);
        } else {
            await addItem(tripId, activityData);
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

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', label: 'Info General', icon: 'info' },
        { id: 'itinerary', label: 'Itinerario', icon: 'list_alt' },
        { id: 'settings', label: 'Configuración', icon: 'tune' },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl my-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-triex-grey dark:text-white">
                            {tripId ? 'Editar Viaje' : 'Nuevo Viaje'}
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {tripId ? 'Modificando detalles del viaje' : 'Completando detalles del nuevo viaje'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center items-center flex-1">
                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Tabs */}
                        <div ref={tabsContainerRef} className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 shrink-0 px-6 pt-2 hide-scrollbar">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    ref={(el) => { tabRefs.current[tab.id] = el; }}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="tripForm" onSubmit={handleSubmit} className="space-y-6">

                                {/* TAB 1: GENERAL */}
                                <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Nombre del viaje *</label>
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
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Código interno</label>
                                                <input
                                                    type="text"
                                                    value={formData.internal_code}
                                                    onChange={(e) => handleInputChange('internal_code', e.target.value)}
                                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                                                    placeholder="TR2026CUN"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Destino *</label>
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
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Fecha de inicio *</label>
                                                <input
                                                    type="date"
                                                    value={formData.start_date}
                                                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                                                    className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${errors.start_date ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                                                />
                                                {errors.start_date && <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Fecha de fin *</label>
                                                <input
                                                    type="date"
                                                    value={formData.end_date}
                                                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                                                    className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${errors.end_date ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                                                />
                                                {errors.end_date && <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Tipo de viaje</label>
                                                <select
                                                    value={formData.trip_type}
                                                    onChange={(e) => handleInputChange('trip_type', e.target.value)}
                                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                >
                                                    <option value="EGRESADOS">Egresados</option>
                                                    <option value="CORPORATIVO">Corporativo</option>
                                                    <option value="FAMILIAR">Familiar</option>
                                                    <option value="GRUPO">Grupo</option>
                                                    <option value="GRUPAL">Grupal (Legacy)</option>
                                                    <option value="INDIVIDUAL">Individual (Legacy)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Submarca</label>
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

                                        <h3 className="text-md font-bold text-triex-grey dark:text-white mt-4 mb-2">Estados</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Estado Comercial</label>
                                                <select
                                                    value={formData.status_commercial}
                                                    onChange={(e) => handleInputChange('status_commercial', e.target.value)}
                                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                >
                                                    <option value="ABIERTO">Con Cupo (Abierto)</option>
                                                    <option value="COMPLETO">Sin Cupo (Completo)</option>
                                                    <option value="CERRADO">Cerrado</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Estado Operativo (automático)</label>
                                                <input
                                                    type="text"
                                                    value={calculateAutoStatus()}
                                                    disabled
                                                    className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 cursor-not-allowed"
                                                />
                                                <p className="mt-2 text-xs text-zinc-500">Se calcula automáticamente según las fechas del viaje</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TAB 2: ITINERARIO */}
                                <div className={activeTab === 'itinerary' ? 'block' : 'hidden'}>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Itinerario General</label>
                                            <textarea
                                                value={formData.general_itinerary}
                                                onChange={(e) => handleInputChange('general_itinerary', e.target.value)}
                                                rows={6}
                                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                                                placeholder="- Día 1: Salida...&#10;- Día 2: City tour..."
                                            />
                                        </div>

                                        <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-base font-bold text-triex-grey dark:text-white">Itinerario Detallado</h3>
                                                    <p className="text-xs text-zinc-500 mt-1">Agrega días con actividades detalladas</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAddDay}
                                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-lg">add</span> Agregar día
                                                </button>
                                            </div>

                                            {days.length > 0 && (
                                                <div className="overflow-x-auto mb-5">
                                                    <div className="flex gap-2 min-w-max">
                                                        {days.map((day) => (
                                                            <button
                                                                key={day.id}
                                                                type="button"
                                                                onClick={() => setSelectedDayId(day.id)}
                                                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${selectedDayId === day.id ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}
                                                            >
                                                                Día {day.day_number} {day.title && <span className="text-xs opacity-80">- {day.title}</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedDayId && days.find(d => d.id === selectedDayId) && (
                                                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-xl">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Título del día (opcional)</label>
                                                            <input
                                                                type="text"
                                                                value={days.find(d => d.id === selectedDayId)?.title || ''}
                                                                onChange={(e) => updateDay(selectedDayId, { title: e.target.value })}
                                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                placeholder="Ej: Llegada a Cancún"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Fecha (opcional)</label>
                                                            <input
                                                                type="date"
                                                                value={days.find(d => d.id === selectedDayId)?.date || ''}
                                                                onChange={(e) => updateDay(selectedDayId, { date: e.target.value })}
                                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Actividades del día</h4>
                                                            <div className="flex gap-2">
                                                                <button type="button" onClick={() => setActivityModal({ isOpen: true, activity: null })} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">add</span> Actividad
                                                                </button>
                                                                <button type="button" onClick={() => handleDeleteDay(selectedDayId)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">delete</span> Eliminar día
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {items.length === 0 ? (
                                                            <p className="text-xs text-zinc-500 text-center py-8 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-300">No hay actividades. Haz clic en "+ Actividad".</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {items.map((item, index) => (
                                                                    <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-start gap-3">
                                                                        <div className="flex flex-col gap-1">
                                                                            <button type="button" onClick={() => handleMoveActivity(index, 'up')} disabled={index === 0} className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"><span className="material-symbols-outlined text-lg">arrow_upward</span></button>
                                                                            <button type="button" onClick={() => handleMoveActivity(index, 'down')} disabled={index === items.length - 1} className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"><span className="material-symbols-outlined text-lg">arrow_downward</span></button>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <div className="flex-1">
                                                                                    {item.time && <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded mb-1">{item.time}</span>}
                                                                                    <h5 className="font-bold text-sm text-triex-grey dark:text-white">{item.title}</h5>
                                                                                    {item.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>}
                                                                                    {item.location_name && <div className="flex items-center gap-1 mt-2 text-xs text-zinc-600"><span className="material-symbols-outlined text-sm">location_on</span>{item.location_name}</div>}
                                                                                </div>
                                                                                <div className="flex gap-1">
                                                                                    <button type="button" onClick={() => setActivityModal({ isOpen: true, activity: item })} className="p-1.5 text-zinc-400 hover:text-primary rounded" title="Editar"><span className="material-symbols-outlined text-lg">edit</span></button>
                                                                                    <button type="button" onClick={() => handleDeleteActivity(item.id)} className="p-1.5 text-zinc-400 hover:text-red-500 rounded" title="Eliminar"><span className="material-symbols-outlined text-lg">delete</span></button>
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

                                            {days.length === 0 && <p className="text-sm text-zinc-500 text-center py-8">Haz clic en "Agregar día" para empezar.</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Incluye</label>
                                            <textarea value={formData.includes_text} onChange={(e) => handleInputChange('includes_text', e.target.value)} rows={5} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm" placeholder="- Vuelos ida y vuelta&#10;- Alojamiento" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">No Incluye</label>
                                            <textarea value={formData.excludes_text} onChange={(e) => handleInputChange('excludes_text', e.target.value)} rows={4} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm" placeholder="- Gastos personales" />
                                        </div>
                                    </div>
                                </div>

                                {/* TAB 3: CONFIGURACIÓN (Consolidada) */}
                                <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
                                    <div className="space-y-8">

                                        {/* SECCIÓN 1: BANNER */}
                                        <div>
                                            <h3 className="text-md font-bold text-triex-grey dark:text-white mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">image</span>Banner de la App</h3>
                                            {(bannerPreview || currentBannerUrl) && (
                                                <div className="relative mb-4 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 h-40 md:h-48 w-full border border-zinc-200 dark:border-zinc-700">
                                                    <img src={bannerPreview || currentBannerUrl || ''} alt="Banner preview" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={handleRemoveBanner} className="absolute top-3 right-3 p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 shadow-lg transition-transform hover:scale-105"><span className="material-symbols-outlined">delete</span></button>
                                                </div>
                                            )}
                                            {!bannerPreview && !currentBannerUrl && (
                                                <label className="block cursor-pointer">
                                                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleBannerFileChange} className="hidden" />
                                                    <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl py-8 px-4 text-center hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-800/50">
                                                        <div className="w-12 h-12 rounded-full bg-zinc-200/50 dark:bg-zinc-700/50 flex items-center justify-center mb-3 text-zinc-500 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                                                            <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                                                        </div>
                                                        <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm mb-1">Hacé clic o arrastrá una imagen</p>
                                                        <p className="text-xs text-zinc-500">JPG, PNG o WebP. Máx 5MB (Recomendado 16:9)</p>
                                                    </div>
                                                </label>
                                            )}
                                        </div>

                                        {/* SECCIÓN 2: CONFIG. AVANZADA */}
                                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
                                            <div className="space-y-6">
                                                <h3 className="text-md font-bold text-triex-grey dark:text-white mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">contacts</span>Contactos del Viaje</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Nombre agente de ventas</label>
                                                        <input type="text" value={formData.coordinator_name} onChange={(e) => handleInputChange('coordinator_name', e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Juan Pérez" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Teléfono agente de ventas</label>
                                                        <input type="tel" value={formData.coordinator_phone} onChange={(e) => handleInputChange('coordinator_phone', e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="+54 9 11 1234-5678" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Email agente de ventas</label>
                                                        <input type="email" value={formData.coordinator_email} onChange={(e) => handleInputChange('coordinator_email', e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="agente@triex.com" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Contacto de emergencia</label>
                                                        <input type="text" value={formData.emergency_contact} onChange={(e) => handleInputChange('emergency_contact', e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="911 o número 24/7" />
                                                    </div>
                                                </div>

                                                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <h3 className="text-md font-bold text-triex-grey dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">edit_note</span>Próximo Paso (Override)</h3>
                                                            <p className="text-sm text-zinc-500 mt-1">Personaliza el próximo paso o usa el cálculo automático</p>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" checked={formData.next_step_override_enabled} onChange={(e) => handleInputChange('next_step_override_enabled', e.target.checked)} className="sr-only peer" />
                                                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                        </label>
                                                    </div>

                                                    {formData.next_step_override_enabled && (
                                                        <div className="space-y-5">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                                <div>
                                                                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Tipo de paso</label>
                                                                    <select value={formData.next_step_type_override} onChange={(e) => handleInputChange('next_step_type_override', e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                                                        <option value="DOCS">Documentación</option><option value="VOUCHERS">Vouchers</option><option value="INFO">Información</option><option value="CONTACT">Contacto</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Título *</label>
                                                                    <input type="text" value={formData.next_step_title_override} onChange={(e) => handleInputChange('next_step_title_override', e.target.value)} className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${errors.next_step_title_override ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`} placeholder="Urgente: Contactar agente de ventas" />
                                                                    {errors.next_step_title_override && <p className="mt-1 text-sm text-red-500">{errors.next_step_title_override}</p>}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Detalle</label>
                                                                <textarea value={formData.next_step_detail_override} onChange={(e) => handleInputChange('next_step_detail_override', e.target.value)} rows={3} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Hay cambios importantes en tu itinerario" />
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                                <div>
                                                                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Texto del botón</label>
                                                                    <input type="text" value={formData.next_step_cta_label_override} onChange={(e) => handleInputChange('next_step_cta_label_override', e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Llamar ahora" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Ruta de navegación</label>
                                                                    <input type="text" value={formData.next_step_cta_route_override} onChange={(e) => handleInputChange('next_step_cta_route_override', e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="/mytrip, /vouchers, /upload-document" />
                                                                </div>
                                                            </div>
                                                            {formData.next_step_title_override && (
                                                                <div className="mt-6 p-5 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Vista previa</h4>
                                                                    <div className="scale-90 origin-top-left">
                                                                        <NextStepCard type={formData.next_step_type_override as any} title={formData.next_step_title_override} detail={formData.next_step_detail_override} ctaLabel={formData.next_step_cta_label_override || 'Ver más'} ctaRoute={formData.next_step_cta_route_override || '/mytrip'} onCtaClick={() => { }} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                                                    <h3 className="text-md font-bold text-triex-grey dark:text-white mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">card_giftcard</span>Orange Pass - Referidos y Puntos</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Categoría del Viaje</label>
                                                            <select value={formData.trip_category} onChange={(e) => handleInputChange('trip_category', e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                                                <option value="OTRO">Otro (no acumula puntos)</option><option value="BRASIL_ANDINOS">Brasil y Andinos (10 pts)</option><option value="CARIBE">Caribe (20 pts)</option><option value="USA_CANADA">EE.UU. y Canadá (30 pts)</option><option value="EUROPA">Europa (40 pts)</option><option value="EXOTICOS">Destinos Exóticos (40 pts)</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center justify-center">
                                                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200">
                                                                <div className="flex items-start gap-3">
                                                                    <span className="material-symbols-outlined text-orange-500">info</span>
                                                                    <div className="text-xs text-zinc-700 dark:text-zinc-300">
                                                                        <p className="font-semibold mb-1">Activación Automática</p>
                                                                        <p>Al asignar pasajeros, se activarán automáticamente como miembros Orange Pass.</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECCIÓN 3: PASAJEROS */}
                                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
                                            <h3 className="text-md font-bold text-triex-grey dark:text-white mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">group</span>Asignación de Pasajeros</h3>
                                            <div className="relative mb-4">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                                                <input type="text" placeholder="Buscar pasajeros..." value={passengerSearch} onChange={(e) => setPassengerSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                            </div>
                                            <div className="mb-4 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                                                {selectedPassengers.length} pasajero{selectedPassengers.length !== 1 ? 's' : ''} seleccionado{selectedPassengers.length !== 1 ? 's' : ''}
                                            </div>
                                            <div className="max-h-96 overflow-y-auto space-y-2 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-800">
                                                {filteredPassengers.length === 0 ? (
                                                    <p className="text-center text-zinc-500 py-8">No se encontraron pasajeros</p>
                                                ) : (
                                                    filteredPassengers.map(passenger => {
                                                        const passengerDocs = passengerDocuments.filter(pd => pd.passenger_id === passenger.id);
                                                        const requiredDocs = requiredDocuments.filter(rd => rd.is_required);
                                                        const isComplete = requiredDocs.length > 0 && requiredDocs.every(req => {
                                                            const doc = passengerDocs.find(pd => pd.required_document_id === req.id);
                                                            return doc && (doc.status === 'approved' || doc.status === 'uploaded');
                                                        });
                                                        const hasPending = passengerDocs.some(pd => pd.status === 'uploaded');
                                                        const hasRejected = passengerDocs.some(pd => pd.status === 'rejected');

                                                        let statusColor = 'text-zinc-400';
                                                        let statusIcon = 'check_circle';
                                                        let statusText = 'Sin datos';

                                                        if (requiredDocs.length === 0) { statusText = 'No requiere doc.'; }
                                                        else if (isComplete) { statusColor = 'text-green-500'; statusText = 'Completo'; }
                                                        else if (hasRejected) { statusColor = 'text-red-500'; statusIcon = 'error'; statusText = 'Rechazado'; }
                                                        else if (hasPending) { statusColor = 'text-amber-500'; statusIcon = 'schedule'; statusText = 'Pendiente revisión'; }
                                                        else { statusText = 'Incompleto'; }

                                                        return (
                                                            <label key={passenger.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
                                                                <input type="checkbox" checked={selectedPassengers.includes(passenger.id)} onChange={() => togglePassenger(passenger.id)} className="w-5 h-5 text-primary border-zinc-300 rounded focus:ring-2 focus:ring-primary/20" />
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-triex-grey dark:text-white text-sm">{passenger.first_name} {passenger.last_name}</div>
                                                                    <div className="text-xs text-zinc-500">{passenger.email}</div>
                                                                </div>
                                                                {tripId && selectedPassengers.includes(passenger.id) && (
                                                                    <div className={`flex items-center gap-1 text-xs font-semibold ${statusColor}`} title={statusText}>
                                                                        <span className="material-symbols-outlined text-base">{statusIcon}</span>
                                                                        <span className="hidden sm:inline">{statusText}</span>
                                                                    </div>
                                                                )}
                                                            </label>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 rounded-b-2xl">
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    form="tripForm"
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-lg">save</span>
                                            {tripId ? 'Guardar cambios' : 'Crear viaje'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            <ActivityModal
                isOpen={activityModal.isOpen}
                activity={activityModal.activity}
                onSave={handleSaveActivity}
                onClose={() => setActivityModal({ isOpen: false, activity: null })}
            />
        </div>
    );
};
