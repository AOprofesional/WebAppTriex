import React from 'react';

interface ConfirmDeleteModalProps {
    passengerName: string;
    isArchived: boolean;
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    passengerName,
    isArchived,
    isOpen,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl border-2 border-red-500">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">
                        delete_forever
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 text-center mb-2">
                    ⚠️ Eliminación Permanente
                </h3>

                {/* Warning Message */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                        Esta acción es IRREVERSIBLE
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                        Se eliminarán permanentemente todos los datos de <strong>{passengerName}</strong>, incluyendo:
                    </p>
                    <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside mt-2 space-y-1">
                        <li>Información personal</li>
                        <li>Vouchers y documentos</li>
                        <li>Historial de puntos</li>
                        <li>Asociaciones con viajes</li>
                    </ul>
                </div>

                {/* Additional Warning if not archived */}
                {!isArchived && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            ⚠️ Solo se pueden eliminar pasajeros archivados. Archiva primero a este pasajero.
                        </p>
                    </div>
                )}

                {/* Confirmation Text */}
                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
                    Escribe <strong>"ELIMINAR"</strong> para confirmar
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!isArchived}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Eliminar Permanentemente
                    </button>
                </div>
            </div>
        </div>
    );
};
