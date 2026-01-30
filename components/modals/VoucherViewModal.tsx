import React, { useState, useEffect } from 'react';
import { useAdminVouchers } from '../../hooks/useAdminVouchers';

interface VoucherViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    voucher: any;
    onEdit: () => void;
    onArchive: () => void;
}

export const VoucherViewModal: React.FC<VoucherViewModalProps> = ({
    isOpen,
    onClose,
    voucher,
    onEdit,
    onArchive,
}) => {
    const { getVoucherSignedUrl } = useAdminVouchers();
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && voucher?.file_path) {
            loadSignedUrl();
        }
    }, [isOpen, voucher]);

    const loadSignedUrl = async () => {
        if (!voucher.file_path) return;

        setLoading(true);
        const { url } = await getVoucherSignedUrl(voucher.file_path);
        setSignedUrl(url);
        setLoading(false);
    };

    const handleDownload = () => {
        if (signedUrl) {
            window.open(signedUrl, '_blank');
        } else if (voucher.external_url) {
            window.open(voucher.external_url, '_blank');
        }
    };

    if (!isOpen || !voucher) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-triex-grey dark:text-white">
                            {voucher.title}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">
                            {voucher.voucher_types?.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Preview */}
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6">
                        {loading && (
                            <div className="flex items-center justify-center h-96">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        )}

                        {!loading && voucher.format === 'pdf' && signedUrl && (
                            <iframe
                                src={signedUrl}
                                className="w-full h-96 rounded-lg"
                                title="PDF Voucher"
                            />
                        )}

                        {!loading && voucher.format === 'image' && signedUrl && (
                            <img
                                src={signedUrl}
                                alt={voucher.title}
                                className="w-full max-h-96 object-contain rounded-lg"
                            />
                        )}

                        {!loading && voucher.format === 'link' && voucher.external_url && (
                            <div className="flex flex-col items-center justify-center h-48 space-y-4">
                                <span className="material-symbols-outlined text-6xl text-primary">link</span>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                    Este voucher es un enlace externo
                                </p>
                                <a
                                    href={voucher.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                                    Abrir Enlace
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                            <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Viaje</p>
                            <p className="text-sm font-semibold text-triex-grey dark:text-white">
                                {voucher.trips?.name || '—'}
                            </p>
                            {voucher.trips?.destination && (
                                <p className="text-xs text-zinc-500 mt-0.5">{voucher.trips.destination}</p>
                            )}
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                            <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Pasajero</p>
                            <p className="text-sm font-semibold text-triex-grey dark:text-white">
                                {voucher.passengers ? `${voucher.passengers.first_name} ${voucher.passengers.last_name}` : 'Todos'}
                            </p>
                        </div>

                        {voucher.provider_name && (
                            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                                <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Proveedor</p>
                                <p className="text-sm font-semibold text-triex-grey dark:text-white">
                                    {voucher.provider_name}
                                </p>
                            </div>
                        )}

                        {voucher.service_date && (
                            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                                <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Fecha de Servicio</p>
                                <p className="text-sm font-semibold text-triex-grey dark:text-white">
                                    {new Date(voucher.service_date).toLocaleDateString('es-AR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}

                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                            <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Formato</p>
                            <p className="text-sm font-semibold text-triex-grey dark:text-white capitalize">
                                {voucher.format === 'image' ? 'Imagen' : voucher.format === 'link' ? 'Enlace' : 'PDF'}
                            </p>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                            <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Visibilidad</p>
                            <p className="text-sm font-semibold text-triex-grey dark:text-white">
                                {voucher.visibility === 'all_trip_passengers' ? 'Todos los pasajeros' : 'Solo asignado'}
                            </p>
                        </div>
                    </div>

                    {voucher.notes && (
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                            <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">Notas</p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                {voucher.notes}
                            </p>
                        </div>
                    )}

                    {/* Creation Info */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>
                            Creado: {new Date(voucher.created_at).toLocaleDateString('es-AR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                        {voucher.updated_at !== voucher.created_at && (
                            <span>
                                Actualizado: {new Date(voucher.updated_at).toLocaleDateString('es-AR', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 justify-end">
                    <button
                        onClick={handleDownload}
                        className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        {voucher.format === 'link' ? 'Abrir' : 'Descargar'}
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Editar
                    </button>
                    <button
                        onClick={onArchive}
                        className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">archive</span>
                        Archivar
                    </button>
                </div>
            </div>
        </div>
    );
};
