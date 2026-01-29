// Local file upload utilities (replacing Supabase Storage)

const API_URL = 'http://localhost:3001';

/**
 * Upload a voucher file to the local server
 * @param file - File to upload
 * @param tripId - Trip ID for organization
 * @param voucherId - Voucher ID for naming
 * @returns Object with fileUrl and error
 */
export const uploadVoucher = async (
    file: File,
    tripId: string,
    voucherId: string
): Promise<{ fileUrl: string | null; error: string | null }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tripId', tripId);
        formData.append('voucherId', voucherId);

        const response = await fetch(`${API_URL}/api/upload/voucher`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al subir el archivo');
        }

        const data = await response.json();
        return { fileUrl: data.fileUrl, error: null };
    } catch (err: any) {
        console.error('Upload error:', err);
        return { fileUrl: null, error: err.message };
    }
};

/**
 * Delete a voucher file from the local server
 * @param fileUrl - Relative path of the file to delete
 * @returns Object with error if any
 */
export const deleteVoucher = async (
    fileUrl: string
): Promise<{ error: string | null }> => {
    try {
        const response = await fetch(`${API_URL}/api/delete/voucher`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileUrl }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar el archivo');
        }

        return { error: null };
    } catch (err: any) {
        console.error('Delete error:', err);
        return { error: err.message };
    }
};

/**
 * Get the full URL for a voucher file
 * For local server, we just return the full URL
 * @param bucketName - Not used for local storage (kept for compatibility)
 * @param filePath - Relative path of the file
 * @returns Object with url
 */
export const getSignedUrl = async (
    bucketName: string,
    filePath: string
): Promise<{ url: string | null; error: string | null }> => {
    try {
        // For local server, we just construct the URL
        const url = `${API_URL}${filePath}`;
        return { url, error: null };
    } catch (err: any) {
        console.error('Get URL error:', err);
        return { url: null, error: err.message };
    }
};

/**
 * Upload a document file to the local server
 * @param file - File to upload
 * @param tripId - Trip ID for organization
 * @param passengerId - Passenger ID
 * @param documentType - Type of document
 * @returns Object with fileUrl and error
 */
export const uploadDocument = async (
    file: File,
    tripId: string,
    passengerId: string,
    documentType: string
): Promise<{ fileUrl: string | null; error: string | null }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tripId', tripId);
        formData.append('passengerId', passengerId);
        formData.append('documentType', documentType);

        const response = await fetch(`${API_URL}/api/upload/document`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al subir el documento');
        }

        const data = await response.json();
        return { fileUrl: data.fileUrl, error: null };
    } catch (err: any) {
        console.error('Upload document error:', err);
        return { fileUrl: null, error: err.message };
    }
};
