import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL, AVATAR_URL } from '../constants'; // Assuming AVATAR_URL exists, or mock it
import { getSignedUrl } from '../utils/storage';
import { usePassengerTrips } from '../hooks/usePassengerTrips';
import { useTripDetails } from '../hooks/useTripDetails';
import { useDocuments, RequiredDocument, PassengerDocument } from '../hooks/useDocuments';
import { PageLoading } from '../components/PageLoading';

export const VouchersAndDocs: React.FC = () => {
    const navigate = useNavigate();
    const { primaryTrip, passenger } = usePassengerTrips();
    const { vouchers, loading: vouchersLoading } = useTripDetails(); // Or useVouchers independent hook if better
    const {
        requiredDocuments,
        passengerDocuments,
        fetchRequiredDocuments,
        fetchPassengerDocuments,
        loading: docsLoading
    } = useDocuments();

    useEffect(() => {
        if (primaryTrip && passenger) {
            fetchRequiredDocuments(primaryTrip.id);
            fetchPassengerDocuments({ tripId: primaryTrip.id, passengerId: passenger.id });
        }
    }, [primaryTrip, passenger]);

    const loading = vouchersLoading || docsLoading;

    const handleVoucherClick = async (voucher: any) => {
        if (voucher.external_url) {
            window.open(voucher.external_url, '_blank');
        } else if (voucher.file_path) {
            const { url, error } = await getSignedUrl(
                voucher.bucket || 'triex-vouchers',
                voucher.file_path
            );
            if (url) {
                window.open(url, '_blank');
            } else if (error) {
                console.error('Error opening voucher:', error);
                alert('No se pudo abrir el voucher. Por favor intente nuevamente.');
            }
        }
    };

    const handleDownload = async (voucher: any) => {
        if (voucher.external_url) {
            window.open(voucher.external_url, '_blank');
        } else if (voucher.file_path) {
            const { url, error } = await getSignedUrl(
                voucher.bucket || 'triex-vouchers',
                voucher.file_path
            );

            if (url) {
                // Force download if possible, otherwise open
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', voucher.title || 'voucher'); // This might differ depending on CORS
                link.setAttribute('target', '_blank');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (error) {
                console.error('Error downloading voucher:', error);
                alert('No se pudo descargar el voucher. Por favor intente nuevamente.');
            }
        }
    };

    const getDocStatus = (reqId: string) => {
        const doc = passengerDocuments.find(d => d.required_document_id === reqId);
        return doc ? doc.status || 'uploaded' : 'missing'; // Default to uploaded if exists but no status, or missing
    };


    if (loading) {
        return <PageLoading message="Cargando documentación..." />;
    }

    return (
        <div className="min-h-screen bg-[#F4F5F9] dark:bg-zinc-950 pb-20 lg:pb-8 font-sans">
            {/* Header Mobile */}
            <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-zinc-950 sticky top-0 z-50 lg:hidden border-b border-zinc-100 dark:border-zinc-800">
                <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-zinc-800 dark:text-zinc-200">
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100">
                    <img src={AVATAR_URL} alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>

            <div className="px-5 pt-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-8">
                    Vouchers y documentación
                </h1>

                {/* VOUCHERS SECTION */}
                <div className="mb-2">
                    <h2 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-4">VOUCHERS</h2>

                    <div className="space-y-4">
                        {/* Example Hotel Card - Dynamic Data would go here matching design */}
                        {vouchers.length === 0 ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 text-center">
                                <p className="text-zinc-500 text-sm">No hay vouchers disponibles aún.</p>
                            </div>
                        ) : (
                            vouchers.map(voucher => (
                                <div key={voucher.id} className="bg-white dark:bg-zinc-900 rounded-[20px] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#6B7280]">
                                                {voucher.title.toLowerCase().includes('hotel') ? 'hotel' : 'confirmation_number'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#1F2937] dark:text-white text-lg">{voucher.title}</h3>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="material-symbols-outlined text-[#6B7280] text-sm">check_circle</span>
                                                <span className="text-[#6B7280] text-sm">Disponible</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleVoucherClick(voucher)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#E5E7EB] rounded-xl text-[#374151] font-medium hover:bg-zinc-50 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                            Ver
                                        </button>
                                        <button
                                            onClick={() => handleDownload(voucher)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#E5E7EB] rounded-xl text-[#374151] font-medium hover:bg-zinc-50 transition-colors">
                                            <span className="material-symbols-outlined text-lg">download</span>
                                            Descargar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* DOCUMENTATION SECTION */}
                <div className="mt-8 mb-8">
                    <h2 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-4">DOCUMENTACIÓN</h2>

                    <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                        {requiredDocuments.map(req => {
                            const status = getDocStatus(req.id);
                            // Determine icon and color based on doc name or type
                            const docName = req.document_types?.name || 'Documento';
                            const icon = docName.toLowerCase().includes('pasaporte') ? 'badge'
                                : docName.toLowerCase().includes('seguro') ? 'health_and_safety'
                                    : docName.toLowerCase().includes('visa') ? 'article'
                                        : 'description';

                            return (
                                <div
                                    key={req.id}
                                    onClick={() => navigate('/upload', { state: { selectedDocId: req.id } })} // Pass doc ID in state
                                    className={`flex items-center justify-between p-5 cursor-pointer transition-all ${(status === 'missing' || status === 'rejected')
                                        ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500'
                                        : 'hover:bg-zinc-50 border-l-4 border-l-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(status === 'missing' || status === 'rejected')
                                            ? 'bg-red-100 text-red-500'
                                            : 'bg-[#F3F4F6] text-[#6B7280]'
                                            }`}>
                                            <span className="material-symbols-outlined">{icon}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${(status === 'missing' || status === 'rejected') ? 'text-red-700' : 'text-[#1F2937] dark:text-white'}`}>
                                                {docName}
                                            </span>
                                            {(status === 'missing' || status === 'rejected') && (
                                                <span className="text-[10px] text-red-500 font-semibold">
                                                    {status === 'rejected' ? 'Rechaado - Ver detalles' : 'Requerido'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold uppercase ${status === 'approved' ? 'text-[#9CA3AF]' :
                                            status === 'uploaded' || status === 'pending' ? 'text-[#F97316]' : 'text-[#EF4444]'
                                            }`}>
                                            {status === 'approved' ? 'APROBADO' :
                                                status === 'uploaded' ? 'PENDIENTE' :
                                                    status === 'missing' ? 'FALTA' : 'RECHAZADO'}
                                        </span>
                                        {status === 'approved' ? (
                                            <div className="w-6 h-6 rounded-full bg-[#6B7280] flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-sm">check</span>
                                            </div>
                                        ) : (status === 'missing' || status === 'rejected') ? (
                                            <span className="material-symbols-outlined text-red-500">error</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[#F97316]">more_horiz</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}


                        {
                            requiredDocuments.length === 0 && (
                                <div className="p-6 text-center text-zinc-500 text-sm">
                                    No hay documentación requerida.
                                </div>
                            )
                        }
                    </div>
                </div>

                <p className="text-xs text-[#9CA3AF] italic text-center px-4 leading-relaxed">
                    * Por favor asegúrese de completar los documentos pendientes antes de su fecha de viaje.
                </p>

            </div>
        </div>
    );
};
