import { supabase } from './supabase';

// Nombres reales de buckets en Supabase
const BUCKET_NAMES = {
    documents: 'triex-documents',
    vouchers: 'triex-vouchers'
} as const;

// Construir path para documento de pasajero
export function buildDocumentPath(
    tripId: string,
    passengerId: string,
    passengerDocumentId: string,
    filename: string
): string {
    const timestamp = Date.now();
    const sanitized = filename
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '_')
        .slice(0, 100);
    return `trips/${tripId}/passengers/${passengerId}/${passengerDocumentId}/${timestamp}-${sanitized}`;
}

// Construir path para voucher
export function buildVoucherPath(
    tripId: string,
    voucherId: string,
    filename: string
): string {
    const timestamp = Date.now();
    const sanitized = filename
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '_')
        .slice(0, 100);
    return `trips/${tripId}/${voucherId}/${timestamp}-${sanitized}`;
}

// Subir archivo a bucket
export async function uploadFile(
    bucket: 'documents' | 'vouchers',
    filePath: string,
    file: File
) {
    const bucketName = BUCKET_NAMES[bucket];
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
        });

    if (error) throw error;
    return data;
}

// Obtener signed URL para ver/descargar (10 min)
export async function getSignedUrl(
    bucket: 'documents' | 'vouchers',
    filePath: string
): Promise<string> {
    const bucketName = BUCKET_NAMES[bucket];
    const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 600); // 600 segundos = 10 min

    if (error) throw error;

    if (!data || !data.signedUrl) {
        throw new Error('Failed to generate signed URL');
    }

    return data.signedUrl;
}

// Borrar archivo de bucket
export async function deleteFile(
    bucket: 'documents' | 'vouchers',
    filePath: string
) {
    const bucketName = BUCKET_NAMES[bucket];
    const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

    if (error) throw error;
}

// Validar tipo de archivo
export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
        if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type);
        }
        return file.type.includes(type);
    });
}

// Validar tamaño de archivo (en MB)
export function validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
}

// Obtener formato de archivo
export function getFileFormat(file: File): 'pdf' | 'image' {
    if (file.type === 'application/pdf') {
        return 'pdf';
    }
    if (file.type.startsWith('image/')) {
        return 'image';
    }
    return 'pdf'; // default
}
