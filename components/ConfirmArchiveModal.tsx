import React from 'react';

interface ConfirmArchiveModalProps {
    passengerName: string;
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmArchiveModal: React.FC<ConfirmArchiveModalProps> = ({
    passengerName,
    isOpen,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-2xl">
                        archive
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-zinc-800 dark:text-white text-center mb-2">
                    Archivar Pasajero
                </h3>

                {/* Message */}
                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
                    ¿Estás seguro de que deseas archivar a <strong>{passengerName}</strong>?
                    <br />
                    <span className="text-xs mt-2 block">
                        El pasajero quedará oculto de la lista principal pero podrá ser restaurado más tarde.
                    </span>
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
                        className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-all"
                    >
                        Archivar
                    </button>
                </div>
            </div>
        </div>
    );
};
