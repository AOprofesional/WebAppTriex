import React, { useState } from 'react';
import { validateProfileImage } from '../utils/profileImageUpload';

interface ProfilePhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPhotoUrl: string | null;
    onUpload: (file: File) => Promise<void>;
    onRemove?: () => Promise<void>;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
    isOpen,
    onClose,
    currentPhotoUrl,
    onUpload,
    onRemove,
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileSelect = (file: File) => {
        setError(null);

        const validation = validateProfileImage(file);
        if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);

        try {
            await onUpload(selectedFile);
            onClose();
            setPreviewUrl(null);
            setSelectedFile(null);
        } catch (err: any) {
            setError(err.message || 'Error al subir la foto');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        if (!onRemove) return;

        setUploading(true);
        setError(null);

        try {
            await onRemove();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar la foto');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (uploading) return;
        setPreviewUrl(null);
        setSelectedFile(null);
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-triex-grey dark:text-white">
                            Foto de perfil
                        </h2>
                        <button
                            onClick={handleClose}
                            disabled={uploading}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-zinc-500">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Preview */}
                    <div className="flex justify-center">
                        <div className="relative w-40 h-40 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-4 border-zinc-200 dark:border-zinc-700">
                            {previewUrl || currentPhotoUrl ? (
                                <img
                                    src={previewUrl || currentPhotoUrl || ''}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                    <span className="material-symbols-outlined text-6xl">person</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${dragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-zinc-300 dark:border-zinc-700 hover:border-primary/50'
                            }`}
                    >
                        <input
                            type="file"
                            id="photo-upload"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                        <label
                            htmlFor="photo-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-2xl">upload</span>
                            </div>
                            <p className="font-bold text-triex-grey dark:text-white">
                                Arrastrá tu foto aquí
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                o hacé clic para seleccionar
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                                JPG, PNG o WebP - Máx 2MB
                            </p>
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {selectedFile ? (
                            <>
                                <button
                                    onClick={handleClose}
                                    disabled={uploading}
                                    className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold transition-transform active:scale-95 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            Subiendo...
                                        </>
                                    ) : (
                                        'Guardar'
                                    )}
                                </button>
                            </>
                        ) : currentPhotoUrl && onRemove ? (
                            <>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold transition-transform active:scale-95"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={handleRemove}
                                    disabled={uploading}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {uploading ? 'Eliminando...' : 'Eliminar foto'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleClose}
                                className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold transition-transform active:scale-95"
                            >
                                Cerrar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
