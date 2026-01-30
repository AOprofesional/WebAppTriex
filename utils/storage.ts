import { supabase } from '../lib/supabase';

/**
 * Upload a voucher file to Supabase Storage
 * Returns full metadata for database storage
 */
export const uploadVoucher = async (
    file: File,
    tripId: string,
    voucherId: string
): Promise<{
    bucket: string | null;
    filePath: string | null;
    mimeType: string | null;
    size: number | null;
    error: string | null;
}> => {
    try {
        const timestamp = Date.now();
        const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
        const fileName = `${timestamp}-${sanitizedName}`;
        const filePath = `trips/${tripId}/${voucherId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('triex-vouchers')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return {
                bucket: null,
                filePath: null,
                mimeType: null,
                size: null,
                error: uploadError.message
            };
        }

        return {
            bucket: 'triex-vouchers',
            filePath,
            mimeType: file.type,
            size: file.size,
            error: null
        };
    } catch (err: any) {
        console.error('Exception during upload:', err);
        return {
            bucket: null,
            filePath: null,
            mimeType: null,
            size: null,
            error: err.message
        };
    }
};

/**
 * Upload a document file to Supabase Storage
 * Returns full metadata for database storage
 */
export const uploadDocument = async (
    file: File,
    tripId: string,
    passengerId: string,
    documentId: string
): Promise<{
    bucket: string | null;
    filePath: string | null;
    mimeType: string | null;
    size: number | null;
    error: string | null;
}> => {
    try {
        const timestamp = Date.now();
        const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
        const fileName = `${timestamp}-${sanitizedName}`;
        const filePath = `trips/${tripId}/passengers/${passengerId}/${documentId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('triex-documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return {
                bucket: null,
                filePath: null,
                mimeType: null,
                size: null,
                error: uploadError.message
            };
        }

        return {
            bucket: 'triex-documents',
            filePath,
            mimeType: file.type,
            size: file.size,
            error: null
        };
    } catch (err: any) {
        console.error('Exception during upload:', err);
        return {
            bucket: null,
            filePath: null,
            mimeType: null,
            size: null,
            error: err.message
        };
    }
};

/**
 * Get a signed URL for a private file
 */
export const getSignedUrl = async (
    bucket: 'triex-vouchers' | 'triex-documents',
    filePath: string,
    expiresIn: number = 3600 // 1 hour default
): Promise<{ url: string | null; error: string | null }> => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, expiresIn);

        if (error) {
            console.error('Signed URL error:', error);
            return { url: null, error: error.message };
        }

        return { url: data.signedUrl, error: null };
    } catch (err: any) {
        console.error('Exception getting signed URL:', err);
        return { url: null, error: err.message };
    }
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (
    bucket: 'triex-vouchers' | 'triex-documents',
    filePath: string
): Promise<{ error: string | null }> => {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error('Delete error:', error);
            return { error: error.message };
        }

        return { error: null };
    } catch (err: any) {
        console.error('Exception during delete:', err);
        return { error: err.message };
    }
};
