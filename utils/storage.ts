import { supabase } from '../lib/supabase';

/**
 * Upload a voucher file to Supabase Storage
 */
export const uploadVoucher = async (
    file: File,
    tripId: string,
    voucherId: string
): Promise<{ fileUrl: string | null; error: string | null }> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `trips/${tripId}/vouchers/${voucherId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('triex-vouchers')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return { fileUrl: null, error: uploadError.message };
        }

        return { fileUrl: filePath, error: null };
    } catch (err: any) {
        console.error('Exception during upload:', err);
        return { fileUrl: null, error: err.message };
    }
};

/**
 * Upload a document file to Supabase Storage
 */
export const uploadDocument = async (
    file: File,
    tripId: string,
    passengerId: string,
    documentId: string
): Promise<{ fileUrl: string | null; error: string | null }> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `trips/${tripId}/passengers/${passengerId}/docs/${documentId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('triex-documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return { fileUrl: null, error: uploadError.message };
        }

        return { fileUrl: filePath, error: null };
    } catch (err: any) {
        console.error('Exception during upload:', err);
        return { fileUrl: null, error: err.message };
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
