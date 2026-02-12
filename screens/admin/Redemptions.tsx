import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PageLoading } from '../../components/PageLoading';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';

interface RedemptionRequest {
    id: string;
    passenger_id: string;
    type: 'NEXT_TRIP' | 'CASH';
    points_amount: number;
    status: 'PENDING' | 'COMPLETED' | 'REJECTED';
    comment: string | null;
    admin_comment: string | null;
    created_at: string;
    processed_at: string | null;
    passenger: {
        first_name: string;
        last_name: string;
        email: string;
        orange_member_number: string;
    };
}

export const Redemptions: React.FC = () => {
    const [requests, setRequests] = useState<RedemptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const toast = useToast();
    const confirm = useConfirm();

    const fetchRequests = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('redemption_requests')
                .select(`
          *,
          passenger:passengers (
            first_name,
            last_name,
            email,
            orange_member_number
          )
        `)
                .order('created_at', { ascending: false });

            if (filter !== 'ALL') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching redemption requests:', error);
            toast.error('Error al cargar', 'No se pudieron cargar las solicitudes de canje.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const handleProcessRequest = async (id: string, status: 'COMPLETED' | 'REJECTED', adminComment?: string) => {
        const confirmed = await confirm.confirm({
            title: `¿Confirmar ${status === 'COMPLETED' ? 'aprobación' : 'rechazo'}?`,
            message: `Estás a punto de ${status === 'COMPLETED' ? 'aprobar' : 'rechazar'} esta solicitud de canje. Esta acción no se puede deshacer.`,
            confirmText: status === 'COMPLETED' ? 'Aprobar' : 'Rechazar',
            confirmVariant: status === 'COMPLETED' ? 'success' : 'danger'
        });

        if (!confirmed) return;

        setProcessingId(id);
        try {
            const { data, error } = await supabase.rpc('process_redemption_request', {
                p_request_id: id,
                p_status: status,
                p_admin_comment: adminComment || null
            });

            if (error) throw error;

            toast.success(
                `Solicitud ${status === 'COMPLETED' ? 'aprobada' : 'rechazada'}`,
                'La solicitud ha sido procesada correctamente.'
            );
            fetchRequests(); // Refresh list
        } catch (error: any) {
            console.error('Error processing request:', error);
            toast.error('Error al procesar', error.message || 'No se pudo procesar la solicitud.');
        } finally {
            setProcessingId(null);
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'NEXT_TRIP': return 'Descuento en Viaje';
            case 'CASH': return 'Retiro en Efectivo';
            default: return type;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
            case 'COMPLETED':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Realizada</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rechazada</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    {(['PENDING', 'COMPLETED', 'REJECTED', 'ALL'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-orange-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'Pendientes' : f === 'COMPLETED' ? 'Realizadas' : 'Rechazadas'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <PageLoading />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pasajero</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentario</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No hay solicitudes {filter !== 'ALL' ? 'en este estado' : ''}
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {request.passenger?.first_name} {request.passenger?.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500">{request.passenger?.email}</div>
                                            <div className="text-xs text-orange-600 mt-1">
                                                #{request.passenger?.orange_member_number}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getTypeLabel(request.type)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                                            {request.points_amount} pts
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={request.comment || ''}>
                                            {request.comment || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {request.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleProcessRequest(request.id, 'COMPLETED')}
                                                        disabled={processingId === request.id}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded transition-colors disabled:opacity-50"
                                                    >
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt('Motivo del rechazo (opcional):');
                                                            if (reason !== null) {
                                                                handleProcessRequest(request.id, 'REJECTED', reason);
                                                            }
                                                        }}
                                                        disabled={processingId === request.id}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors disabled:opacity-50"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}
                                            {request.status !== 'PENDING' && (
                                                <span className="text-gray-400 text-xs">Procesado</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
