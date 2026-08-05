import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database.types';
import { useOrangePass } from '../../hooks/useOrangePass';

type PassengerListView = {
    id: string;
    created_at: string | null;
    first_name: string;
    last_name: string;
    passenger_email: string | null;
    phone: string | null;
    document_type: string | null;
    document_number: string | null;
    type_name: string | null;
    savia_file_number: string | null;
    profile_id: string | null;
    is_recurrent: boolean | null;
    archived_at: string | null;
    avatar_url?: string | null;
    parent_passenger_id?: string | null;
    parent_first_name?: string | null;
    parent_last_name?: string | null;
};

interface Trip {
    id: string;
    name: string;
    destination: string;
    start_date: string;
    end_date: string;
    status: string;
}

interface Document {
    id: string;
    document_type_name: string;
    status: string;
    uploaded_at: string | null;
    reviewed_at: string | null;
    review_comment: string | null;
}

interface Voucher {
    id: string;
    title: string;
    provider: string;
    service_date: string | null;
    format: string;
    type: string;
}

interface PassengerDetailsModalProps {
    passenger: PassengerListView | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onArchive?: () => void;
}

export const PassengerDetailsModal: React.FC<PassengerDetailsModalProps> = ({
    passenger,
    isOpen,
    onClose,
    onEdit,
    onArchive
}) => {
    const [currentPassenger, setCurrentPassenger] = useState<PassengerListView | null>(passenger);
    const [activeTab, setActiveTab] = useState<'info' | 'companions' | 'trips' | 'documents' | 'vouchers' | 'orange_pass'>('info');
    const [trips, setTrips] = useState<Trip[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [companions, setCompanions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fullPassengerData, setFullPassengerData] = useState<any>(null);

    // Synchronize currentPassenger when modal opens or passenger prop changes
    useEffect(() => {
        if (passenger) {
            setCurrentPassenger(passenger);
        }
    }, [passenger, isOpen]);

    // Orange Pass Hook
    const {
        balance,
        pointsHistory,
        referredPassengers,
        loading: orangePassLoading,
        refetch: refetchOrangePass
    } = useOrangePass(currentPassenger?.id);

    useEffect(() => {
        if (isOpen && currentPassenger) {
            fetchRelatedData();
            fetchFullPassengerData();
        }
    }, [isOpen, currentPassenger]);

    const fetchFullPassengerData = async () => {
        if (!currentPassenger) return;
        const { data, error } = await supabase
            .from('passengers')
            .select(`
                *,
                referred_by_passenger:referred_by_passenger_id(first_name, last_name, orange_referral_code),
                parent_passenger:parent_passenger_id(id, first_name, last_name, email, phone, document_type, document_number, savia_file_number, archived_at)
            `)
            .eq('id', currentPassenger.id)
            .single();

        if (!error && data) {
            setFullPassengerData(data);
        }
    };

    const handleSwitchPassenger = (target: any) => {
        setCurrentPassenger({
            id: target.id,
            created_at: target.created_at || null,
            first_name: target.first_name,
            last_name: target.last_name,
            passenger_email: target.email || target.passenger_email || null,
            phone: target.phone || null,
            document_type: target.document_type || null,
            document_number: target.document_number || null,
            type_name: target.passenger_types?.name || target.type_name || null,
            savia_file_number: target.savia_file_number || null,
            profile_id: target.profile_id || null,
            is_recurrent: target.is_recurrent ?? false,
            archived_at: target.archived_at || null,
            avatar_url: target.avatar_url || null,
            parent_passenger_id: target.parent_passenger_id || null,
            parent_first_name: target.parent_first_name || null,
            parent_last_name: target.parent_last_name || null,
        });
        setActiveTab('info');
    };

    const fetchRelatedData = async () => {
        if (!currentPassenger) return;

        setLoading(true);
        try {
            // Fetch companions
            const { data: compData } = await supabase
                .from('passengers')
                .select('id, first_name, last_name, email, phone, document_type, document_number, savia_file_number, is_recurrent, archived_at, created_at, passenger_types(name)')
                .eq('parent_passenger_id', currentPassenger.id)
                .order('created_at', { ascending: true });

            setCompanions(compData || []);

            // Fetch trips
            const { data: tripsData, error: tripsError } = await supabase
                .from('trip_passengers')
                .select(`
                    trip_id,
                    trips (
                        id,
                        name,
                        destination,
                        start_date,
                        end_date,
                        status_commercial
                    )
                `)
                .eq('passenger_id', currentPassenger.id);

            if (tripsError) console.error('Error fetching trips:', tripsError);

            setTrips(tripsData?.map((tp: any) => ({
                ...tp.trips,
                status: tp.trips?.status_commercial || 'unknown'
            })).filter((t: any) => t && t.id) || []);

            // Fetch documents
            const { data: docsData } = await supabase
                .from('passenger_documents')
                .select(`
                    id,
                    status,
                    uploaded_at,
                    reviewed_at,
                    review_comment,
                    required_documents!inner (
                        document_types (
                            name
                        )
                    )
                `)
                .eq('passenger_id', currentPassenger.id);

            setDocuments(docsData?.map((doc: any) => ({
                id: doc.id,
                document_type_name: doc.required_documents?.document_types?.name || 'Unknown',
                status: doc.status,
                uploaded_at: doc.uploaded_at,
                reviewed_at: doc.reviewed_at,
                review_comment: doc.review_comment
            })) || []);

            // Fetch vouchers
            const tripIds = tripsData?.map((tp: any) => tp.trip_id).filter(Boolean) || [];
            let voucherQuery = supabase
                .from('vouchers')
                .select('id, title, provider_name, service_date, format, type_id, visibility, trip_id, passenger_id, status')
                .eq('status', 'active');

            if (tripIds.length > 0) {
                voucherQuery = voucherQuery.or(
                    `passenger_id.eq.${currentPassenger.id},and(trip_id.in.(${tripIds.join(',')}),visibility.eq.all_trip_passengers)`
                );
            } else {
                voucherQuery = voucherQuery.eq('passenger_id', currentPassenger.id);
            }

            const { data: vouchersData } = await voucherQuery;

            setVouchers(vouchersData?.map((v: any) => ({
                id: v.id,
                title: v.title,
                provider: v.provider_name || 'Sin proveedor',
                service_date: v.service_date,
                format: v.format,
                type: v.type_id || 'general',
            })) || []);
        } catch (error) {
            console.error('Error fetching related data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !currentPassenger) return null;

    const fullName = `${currentPassenger.first_name} ${currentPassenger.last_name}`;
    const initials = `${currentPassenger.first_name?.[0] || ''}${currentPassenger.last_name?.[0] || ''}`;
    const isCompanion = !!(currentPassenger.parent_passenger_id || fullPassengerData?.parent_passenger_id);
    const parentPassenger = fullPassengerData?.parent_passenger;

    const tabs = [
        { key: 'info' as const, label: 'Información', icon: 'person' },
        { key: 'companions' as const, label: 'Acompañantes', icon: 'group', count: companions.length },
        { key: 'orange_pass' as const, label: 'Orange Pass', icon: 'card_giftcard' },
        { key: 'trips' as const, label: 'Viajes', icon: 'flight_takeoff', count: trips.length },
        { key: 'documents' as const, label: 'Documentos', icon: 'description', count: documents.length },
        { key: 'vouchers' as const, label: 'Vouchers', icon: 'confirmation_number', count: vouchers.length },
    ];

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
            uploaded: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            approved: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            rejected: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        };
        return styles[status] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden flex-shrink-0">
                                {currentPassenger.avatar_url ? (
                                    <img src={currentPassenger.avatar_url} alt={initials} className="w-full h-full object-cover" />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">{fullName}</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentPassenger.passenger_email || 'Sin correo electrónico'}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${currentPassenger.archived_at ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                        {currentPassenger.archived_at ? 'Archivado' : 'Activo'}
                                    </span>
                                    {isCompanion ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/40">
                                            <span className="material-symbols-outlined text-sm">group</span>
                                            Acompañante{parentPassenger?.first_name ? ` de ${parentPassenger.first_name} ${parentPassenger.last_name}` : ''}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                                            <span className="material-symbols-outlined text-sm">person</span>
                                            Titular
                                        </span>
                                    )}
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                        {currentPassenger.type_name || 'Sin tipo'}
                                    </span>
                                    {fullPassengerData?.is_orange_member && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                            Orange Member
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {onEdit && !currentPassenger.archived_at && (
                                <button
                                    onClick={onEdit}
                                    className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined">edit</span>
                                </button>
                            )}
                            {onArchive && (
                                <button
                                    onClick={onArchive}
                                    className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                    title={currentPassenger.archived_at ? "Restaurar" : "Archivar"}
                                >
                                    <span className="material-symbols-outlined">
                                        {currentPassenger.archived_at ? 'unarchive' : 'archive'}
                                    </span>
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                title="Cerrar"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-6 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.key
                                    ? 'bg-primary text-white'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.key
                                        ? 'bg-white/20 text-white'
                                        : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                        </div>
                    ) : (
                        <>
                            {/* Info Tab */}
                            {activeTab === 'info' && (
                                <div className="space-y-6">
                                    {/* Companion notice if viewing a companion */}
                                    {isCompanion && parentPassenger && (
                                        <div className="p-4 bg-purple-50/70 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/40 flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                                                    <span className="material-symbols-outlined text-xl">supervisor_account</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">Pasajero Titular</p>
                                                    <p className="font-bold text-zinc-800 dark:text-white text-base">
                                                        {parentPassenger.first_name} {parentPassenger.last_name}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {parentPassenger.email ? `${parentPassenger.email} • ` : ''}
                                                        {parentPassenger.document_number ? `${parentPassenger.document_type || 'DOC'} ${parentPassenger.document_number}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleSwitchPassenger(parentPassenger)}
                                                className="px-3.5 py-2 bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold border border-purple-200 dark:border-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                            >
                                                Ver Titular <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Companions banner if viewing titular with registered companions */}
                                    {!isCompanion && companions.length > 0 && (
                                        <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30 flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                                                    <span className="material-symbols-outlined text-lg">group</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">Grupo de Viaje</p>
                                                    <p className="text-sm font-bold text-zinc-800 dark:text-white">
                                                        {companions.length} {companions.length === 1 ? 'acompañante vinculado' : 'acompañantes vinculados'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('companions')}
                                                className="px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                                            >
                                                Ver Acompañantes <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Nombre Completo</label>
                                            <p className="text-base text-zinc-800 dark:text-white">{fullName}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Email</label>
                                            <p className="text-base text-zinc-800 dark:text-white">{currentPassenger.passenger_email || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Teléfono</label>
                                            <p className="text-base text-zinc-800 dark:text-white">{currentPassenger.phone || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Documento</label>
                                            <p className="text-base text-zinc-800 dark:text-white">
                                                {currentPassenger.document_number ? `${currentPassenger.document_type || 'DOC'} ${currentPassenger.document_number}` : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Tipo de Pasajero</label>
                                            <p className="text-base text-zinc-800 dark:text-white">{currentPassenger.type_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Expediente SAVIA</label>
                                            <p className="text-base text-zinc-800 dark:text-white">{currentPassenger.savia_file_number || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Perfil de Usuario</label>
                                            <p className="text-base text-zinc-800 dark:text-white">
                                                {currentPassenger.profile_id ? (
                                                    <span className="text-green-600 dark:text-green-400">✓ Vinculado</span>
                                                ) : (
                                                    <span className="text-zinc-500">Sin vincular</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Companions Tab */}
                            {activeTab === 'companions' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                        <div>
                                            <h3 className="font-bold text-zinc-800 dark:text-white text-lg flex items-center gap-2">
                                                <span className="material-symbols-outlined text-purple-600">group</span>
                                                {isCompanion ? 'Grupo de Viaje' : `Acompañantes de ${fullName}`}
                                            </h3>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {isCompanion 
                                                    ? 'Acompañantes registrados bajo la misma cuenta o titular.'
                                                    : 'Cada acompañante cuenta con su propio registro individual de pasajero.'}
                                            </p>
                                        </div>
                                        <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/70">
                                            {companions.length} {companions.length === 1 ? 'Acompañante' : 'Acompañantes'}
                                        </span>
                                    </div>

                                    {/* If viewing a companion, also show the Titular card at the top of companions tab */}
                                    {isCompanion && parentPassenger && (
                                        <div className="bg-purple-50/60 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800/40 flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                                                    <span className="material-symbols-outlined">person</span>
                                                </div>
                                                <div>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-200/70 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                                                        Titular Responsable
                                                    </span>
                                                    <h4 className="font-bold text-zinc-800 dark:text-white text-base mt-1">
                                                        {parentPassenger.first_name} {parentPassenger.last_name}
                                                    </h4>
                                                    <p className="text-xs text-zinc-500">
                                                        {parentPassenger.email || 'Sin correo'} • {parentPassenger.document_number ? `${parentPassenger.document_type || 'DOC'} ${parentPassenger.document_number}` : 'Sin documento'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleSwitchPassenger(parentPassenger)}
                                                className="px-4 py-2 bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold border border-purple-200 dark:border-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                            >
                                                Ver Perfil del Titular <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    )}

                                    {companions.length === 0 ? (
                                        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                                            <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-700 mb-3 block">group_off</span>
                                            <h3 className="font-bold text-base text-zinc-800 dark:text-white mb-1">Sin acompañantes registrados</h3>
                                            <p className="text-sm text-zinc-500 max-w-md mx-auto">
                                                Este pasajero titular no tiene acompañantes asociados en el sistema.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {companions.map((comp) => {
                                                const compInitials = `${comp.first_name?.[0] || ''}${comp.last_name?.[0] || ''}`;
                                                const isCurrentlyViewed = comp.id === currentPassenger.id;

                                                return (
                                                    <div 
                                                        key={comp.id}
                                                        className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                                                            isCurrentlyViewed
                                                                ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
                                                                : 'bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200/70 dark:border-zinc-700/60'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                                    {compInitials}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="font-bold text-zinc-800 dark:text-white text-sm">
                                                                            {comp.first_name} {comp.last_name}
                                                                        </h4>
                                                                        {isCurrentlyViewed && (
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                                                                                Viendo
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                                        {comp.document_number ? `${comp.document_type || 'DOC'} ${comp.document_number}` : 'Sin documento'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${comp.archived_at ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                                {comp.archived_at ? 'Archivado' : 'Activo'}
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 pt-3 border-t border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                                                            <span className="text-xs text-zinc-500">
                                                                {comp.passenger_types?.name || 'Pasajero Acompañante'}
                                                            </span>
                                                            {!isCurrentlyViewed && (
                                                                <button
                                                                    onClick={() => handleSwitchPassenger(comp)}
                                                                    className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
                                                                >
                                                                    Ver detalles <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Orange Pass Tab */}
                            {activeTab === 'orange_pass' && (
                                <div className="space-y-8">
                                    {/* Membership Info */}
                                    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white text-center sm:text-left sm:flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                                <span className="material-symbols-outlined">card_membership</span>
                                                <h3 className="font-bold text-lg">Membresía Orange Pass</h3>
                                            </div>
                                            {fullPassengerData?.is_orange_member ? (
                                                <>
                                                    <p className="opacity-90">Miembro Activo</p>
                                                    <div className="mt-2 flex flex-col sm:flex-row gap-4">
                                                        <div>
                                                            <span className="text-xs uppercase opacity-75 block">N° Socio</span>
                                                            <span className="font-mono font-bold text-xl">{fullPassengerData.orange_member_number}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs uppercase opacity-75 block">Código Referido</span>
                                                            <span className="font-mono font-bold text-xl">{fullPassengerData.orange_referral_code}</span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div>
                                                    <p className="opacity-90">Este pasajero aún no es miembro activo.</p>
                                                    <p className="text-sm opacity-75 mt-1">Se activará automáticamente tras su primera compra confirmada.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-6 sm:mt-0 bg-white/10 rounded-lg p-4 backdrop-blur-sm text-center min-w-[150px]">
                                            <span className="text-xs uppercase opacity-75 block mb-1">Puntos Totales</span>
                                            <span className="text-4xl font-black">{balance.total}</span>
                                            <div className="flex justify-center gap-4 mt-2 text-xs">
                                                <span title="Activos">{balance.active} activos</span>
                                                <span className="opacity-60" title="Vencidos">{balance.expired} vencidos</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Referrals */}
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">group_add</span>
                                                Referidos ({referredPassengers.length})
                                            </h4>

                                            {referredPassengers.length === 0 ? (
                                                <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                                                    <p className="text-sm text-zinc-500">No ha referido a nadie aún</p>
                                                </div>
                                            ) : (
                                                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                                    <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                                                        {referredPassengers.map((ref) => (
                                                            <div key={ref.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                                <div>
                                                                    <p className="font-semibold text-zinc-800 dark:text-white">{ref.first_name} {ref.last_name}</p>
                                                                    <p className="text-xs text-zinc-500">{ref.email}</p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    {ref.points_awarded ? (
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                            Puntos Acreditados
                                                                        </span>
                                                                    ) : ref.has_confirmed_purchase ? (
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                                            Compra Confirmada
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                                            Asociado
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Referred By Section */}
                                            {fullPassengerData?.referred_by_passenger && (
                                                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                                    <p className="text-xs font-bold text-green-800 dark:text-green-400 uppercase mb-2 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">handshake</span>
                                                        Referido Por
                                                    </p>
                                                    <div>
                                                        <p className="font-bold text-zinc-800 dark:text-white">
                                                            {fullPassengerData.referred_by_passenger.first_name} {fullPassengerData.referred_by_passenger.last_name}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 mt-1">
                                                            Código usado: <span className="font-mono font-medium">{fullPassengerData.referred_by_code_raw}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Points History */}
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">history</span>
                                                Historial de Puntos
                                            </h4>

                                            {pointsHistory.length === 0 ? (
                                                <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                                                    <p className="text-sm text-zinc-500">No hay movimientos de puntos</p>
                                                </div>
                                            ) : (
                                                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                                    <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                                                        {pointsHistory.map((entry) => (
                                                            <div key={entry.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                                <div className="flex items-start justify-between mb-1">
                                                                    <span className="font-semibold text-zinc-800 dark:text-white flex items-center gap-1">
                                                                        +{entry.points}
                                                                        <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 rounded">PTS</span>
                                                                    </span>
                                                                    <span className="text-xs text-zinc-500">
                                                                        {new Date(entry.credited_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                                                    Referido: {entry.source_passenger?.first_name} {entry.source_passenger?.last_name}
                                                                </p>
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <span className="text-xs text-zinc-400 capitalize bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                                                        {entry.trip_category?.toLowerCase().replace('_', ' ')}
                                                                    </span>
                                                                    {entry.status === 'EXPIRED' && (
                                                                        <span className="text-[10px] font-bold text-red-500">VENCIDOS</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Trips Tab */}
                            {activeTab === 'trips' && (
                                <div className="space-y-4">
                                    {trips.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-700 mb-4 block">flight_takeoff</span>
                                            <h3 className="font-bold text-lg text-zinc-800 dark:text-white mb-2">No hay viajes asignados</h3>
                                            <p className="text-sm text-zinc-500">Este pasajero aún no está asignado a ningún viaje</p>
                                        </div>
                                    ) : (
                                        trips.map((trip) => (
                                            <div key={trip.id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-zinc-800 dark:text-white">{trip.name}</h4>
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{trip.destination}</p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                                            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${trip.status === 'active' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                        trip.status === 'completed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                                                        }`}>
                                                        {trip.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Documents Tab */}
                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    {documents.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-700 mb-4 block">description</span>
                                            <h3 className="font-bold text-lg text-zinc-800 dark:text-white mb-2">No hay documentos</h3>
                                            <p className="text-sm text-zinc-500">Este pasajero no tiene documentos requeridos</p>
                                        </div>
                                    ) : (
                                        documents.map((doc) => (
                                            <div key={doc.id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-zinc-800 dark:text-white">{doc.document_type_name}</h4>
                                                        {doc.review_comment && (
                                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{doc.review_comment}</p>
                                                        )}
                                                        <p className="text-xs text-zinc-500 mt-1">
                                                            {doc.uploaded_at ? `Subido: ${new Date(doc.uploaded_at).toLocaleDateString()}` : 'No subido'}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getStatusBadge(doc.status)}`}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Vouchers Tab */}
                            {activeTab === 'vouchers' && (
                                <div className="space-y-4">
                                    {vouchers.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-700 mb-4 block">confirmation_number</span>
                                            <h3 className="font-bold text-lg text-zinc-800 dark:text-white mb-2">No hay vouchers</h3>
                                            <p className="text-sm text-zinc-500">Este pasajero no tiene vouchers disponibles</p>
                                        </div>
                                    ) : (
                                        vouchers.map((voucher) => (
                                            <div key={voucher.id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-zinc-800 dark:text-white">{voucher.title}</h4>
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{voucher.provider}</p>
                                                        {voucher.service_date && (
                                                            <p className="text-xs text-zinc-500 mt-1">
                                                                Fecha: {new Date(voucher.service_date).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                                                            {voucher.type}
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400 uppercase">
                                                            {voucher.format}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
