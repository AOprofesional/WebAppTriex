import React, { useState, useCallback } from 'react';
import { uploadFile } from '../lib/storageHelpers';

interface FileUploaderProps {
    bucket: 'documents' | 'vouchers';
    filePath: string;
    onUploadComplete: (filePath: string) => void;
    onError?: (error: string) => void;
    accept?: string;
    maxSizeMB?: number;
    label?: string;
    disabled?: boolean;
}

export function FileUploader({
    bucket,
    filePath,
    onUploadComplete,
    onError,
    accept = '.pdf,.jpg,.jpeg,.png',
    maxSizeMB = 20,
    label = 'Seleccionar archivo',
    disabled = false
}: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const validateFile = (file: File): boolean => {
        // Validar tamaño
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            const msg = `El archivo excede el tamaño máximo de ${maxSizeMB} MB`;
            setError(msg);
            if (onError) onError(msg);
            return false;
        }

        // Validar tipo
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const isValid = acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type);
            }
            return file.type.includes(type.replace('*', ''));
        });

        if (!isValid) {
            const msg = `Tipo de archivo no permitido. Formatos aceptados: ${accept}`;
            setError(msg);
            if (onError) onError(msg);
            return false;
        }

        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && validateFile(selectedFile)) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (validateFile(droppedFile)) {
                setFile(droppedFile);
                setError(null);
            }
        }
    }, [accept, maxSizeMB]);

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            setProgress(30);
            await uploadFile(bucket, filePath, file);
            setProgress(100);
            onUploadComplete(filePath);

            // Reset
            setFile(null);
            setProgress(0);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al subir archivo';
            setError(msg);
            if (onError) onError(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setError(null);
        setProgress(0);
    };

    return (
        <div className="file-uploader">
            {!file ? (
                <div
                    className={`upload-zone ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="file-input"
                        accept={accept}
                        onChange={handleFileChange}
                        disabled={disabled || uploading}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="file-input" className="upload-label">
                        <div className="upload-icon">📁</div>
                        <p className="upload-text">{label}</p>
                        <p className="upload-hint">
                            o arrastra archivo aquí
                        </p>
                        <p className="upload-restrictions">
                            {accept} • Máx {maxSizeMB} MB
                        </p>
                    </label>
                </div>
            ) : (
                <div className="file-preview">
                    <div className="file-info">
                        <span className="file-icon">
                            {file.type.includes('pdf') ? '📄' : '🖼️'}
                        </span>
                        <div className="file-details">
                            <p className="file-name">{file.name}</p>
                            <p className="file-size">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        {!uploading && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="remove-btn"
                                disabled={disabled}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {uploading && progress > 0 && (
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {!uploading && (
                        <button
                            type="button"
                            onClick={handleUpload}
                            className="upload-btn"
                            disabled={disabled}
                        >
                            Subir archivo
                        </button>
                    )}
                </div>
            )}

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            <style jsx>{`
        .file-uploader {
          width: 100%;
        }

        .upload-zone {
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: #f7fafc;
        }

        .upload-zone:hover:not(.disabled) {
          border-color: #4299e1;
          background: #ebf8ff;
        }

        .upload-zone.drag-active {
          border-color: #4299e1;
          background: #bee3f8;
        }

        .upload-zone.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-label {
          cursor: pointer;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .upload-text {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.25rem;
        }

        .upload-hint {
          font-size: 0.875rem;
          color: #718096;
          margin-bottom: 0.5rem;
        }

        .upload-restrictions {
          font-size: 0.75rem;
          color: #a0aec0;
        }

        .file-preview {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          background: white;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .file-icon {
          font-size: 2rem;
        }

        .file-details {
          flex: 1;
          text-align: left;
        }

        .file-name {
          font-weight: 600;
          color: #2d3748;
          margin: 0;
          word-break: break-word;
        }

        .file-size {
          font-size: 0.875rem;
          color: #718096;
          margin: 0.25rem 0 0;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #e53e3e;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
        }

        .remove-btn:hover {
          color: #c53030;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .progress-fill {
          height: 100%;
          background: #4299e1;
          transition: width 0.3s ease;
        }

        .upload-btn {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .upload-btn:hover:not(:disabled) {
          background: #3182ce;
        }

        .upload-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: #fff5f5;
          border: 1px solid #fc8181;
          border-radius: 6px;
          color: #c53030;
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
}
