import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadFile, buildDocumentPath, getFileFormat, validateFileType, validateFileSize } from '../lib/storageHelpers';

interface UploadDocumentParams {
    file: File;
    tripId: string;
    passengerId: string;
    requiredDocumentId: string;
}

const ALLOWED_TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_SIZE_MB = 20;

export function useDocumentUpload() {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const uploadDocument = async ({
        file,
        tripId,
        passengerId,
        requiredDocumentId
    }: UploadDocumentParams) => {
        setUploading(true);
        setError(null);
        setProgress(0);

        try {
            // Validar tipo de archivo
            if (!validateFileType(file, ALLOWED_TYPES)) {
                throw new Error('Tipo de archivo no permitido. Use PDF, JPG o PNG');
            }

            // Validar tamaño
            if (!validateFileSize(file, MAX_SIZE_MB)) {
                throw new Error(`El archivo excede el tamaño máximo de ${MAX_SIZE_MB} MB`);
            }

            setProgress(10);

            // 1. Crear registro en passenger_documents para obtener ID
            const { data: docRecord, error: dbError } = await supabase
                .from('passenger_documents')
                .insert({
                    trip_id: tripId,
                    passenger_id: passengerId,
                    required_document_id: requiredDocumentId,
                    format: getFileFormat(file),
                    bucket: 'triex-documents',
                    mime_type: file.type,
                    size: file.size,
                    status: 'uploaded'
                })
                .select()
                .single();

            if (dbError) throw dbError;
            if (!docRecord) throw new Error('Failed to create document record');

            setProgress(30);

            // 2. Construir path usando el ID del documento
            const filePath = buildDocumentPath(tripId, passengerId, docRecord.id, file.name);

            setProgress(40);

            // 3. Subir archivo a storage
            await uploadFile('documents', filePath, file);

            setProgress(70);

            // 4. Actualizar registro con file_path
            const { error: updateError } = await supabase
                .from('passenger_documents')
                .update({ file_path: filePath })
                .eq('id', docRecord.id);

            if (updateError) {
                // Si falla la actualización, intentar borrar el archivo subido
                try {
                    await supabase.storage.from('documents').remove([filePath]);
                } catch (cleanupError) {
                    console.error('Failed to cleanup file:', cleanupError);
                }
                throw updateError;
            }

            setProgress(100);
            setUploading(false);
            return docRecord;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setError(msg);
            setUploading(false);
            setProgress(0);
            throw err;
        }
    };

    const reset = () => {
        setError(null);
        setProgress(0);
    };

    return { uploadDocument, uploading, error, progress, reset };
}
