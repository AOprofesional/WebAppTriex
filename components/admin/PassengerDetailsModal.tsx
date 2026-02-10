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
    profile_id: string | null;
    is_recurrent: boolean | null;
    archived_at: string | null;
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
    const [activeTab, setActiveTab] = useState<'info' | 'trips' | 'documents' | 'vouchers' | 'orange_pass'>('info');
    const [trips, setTrips] = useState<Trip[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(false);
    const [fullPassengerData, setFullPassengerData] = useState<any>(null);

    // Orange Pass Hook
    const {
        balance,
        pointsHistory,
        referredPassengers,
        loading: orangePassLoading,
        refetch: refetchOrangePass
    } = useOrangePass(passenger?.id);

    useEffect(() => {
        if (isOpen && passenger) {
            fetchRelatedData();
            fetchFullPassengerData();
        }
    }, [isOpen, passenger]);

    const fetchFullPassengerData = async () => {
        if (!passenger) return;
        const { data, error } = await supabase
            .from('passengers')
            .select('*, referred_by_passenger:referred_by_passenger_id(first_name, last_name, orange_referral_code)')
            .eq('id', passenger.id)
            .single();

        if (!error && data) {
            setFullPassengerData(data);
        }
    };

    const fetchRelatedData = async () => {
        if (!passenger) return;

        setLoading(true);
        try {
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
                .eq('passenger_id', passenger.id);

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
                .eq('passenger_id', passenger.id);

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
                    `passenger_id.eq.${passenger.id},and(trip_id.in.(${tripIds.join(',')}),visibility.eq.all_trip_passengers)`
                );
            } else {
                voucherQuery = voucherQuery.eq('passenger_id', passenger.id);
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

    if (!isOpen || !passenger) return null;

    const fullName = `${passenger.first_name} ${passenger.last_name}`;
    const initials = `${passenger.first_name[0]}${passenger.last_name[0]}`;

    const tabs = [
        { key: 'info' as const, label: 'Información', icon: 'person' },
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
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                {initials}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">{fullName}</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{passenger.passenger_email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${passenger.archived_at ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                        {passenger.archived_at ? 'Archivado' : 'Activo'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                        {passenger.type_name || 'Sin tipo'}
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
                            {onEdit && !passenger.archived_at && (
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
                                    title={passenger.archived_at ? "Restaurar" : "Archivar"}
                                >
                                    <span className="material-symbols-outlined">
                                        {passenger.archived_at ? 'unarchive' : 'archive'}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Nombre Completo</label>
                                            <p className="text-base text-zinc-800 dark:text-white">{fullName}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Email</label>
                                            <p className="text-base text-zinc-800 dark:text-white">{passenger.passenger_email || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Teléfono</label>
                                            <p className="text-base text-zinc-800 dark:text-white">{passenger.phone || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Documento</label>
                                            <p className="text-base text-zinc-800 dark:text-white">
                                                {passenger.document_number ? `${passenger.document_type} ${passenger.document_number}` : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Tipo de Pasajero</label>
                                            <p className="text-base text-zinc-800 dark:text-white">{passenger.type_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Perfil de Usuario</label>
                                            <p className="text-base text-zinc-800 dark:text-white">
                                                {passenger.profile_id ? (
                                                    <span className="text-green-600 dark:text-green-400">✓ Vinculado</span>
                                                ) : (
                                                    <span className="text-zinc-500">Sin vincular</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
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
