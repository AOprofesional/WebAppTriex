import { supabase } from '../lib/supabase';

/**
 * Compress and resize an image file client-side
 * @param file - Original image file
 * @param maxWidth - Maximum width (default 1200px for banners)
 * @param quality - JPEG quality 0-1 (default 0.85)
 * @returns Compressed blob
 */
export async function compressImage(
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.85
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Maintain aspect ratio
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas toBlob failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

/**
 * Upload trip banner to Supabase Storage
 * @param file - Image file to upload
 * @param tripId - Trip ID
 * @returns Public URL of uploaded image
 */
export async function uploadTripBanner(file: File, tripId: string): Promise<string> {
    try {
        // Compress image before upload
        const compressedBlob = await compressImage(file);

        // Generate unique filename
        const fileExt = 'jpg'; // Always save as JPEG after compression
        const fileName = `${tripId}-${Date.now()}.${fileExt}`;
        const filePath = `trip-banners/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('trip-banners')
            .upload(filePath, compressedBlob, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('trip-banners')
            .getPublicUrl(data.path);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading trip banner:', error);
        throw error;
    }
}

/**
 * Delete trip banner from storage
 * @param url - Public URL of the banner to delete
 */
export async function deleteTripBanner(url: string): Promise<void> {
    try {
        // Extract file path from URL
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/trip-banners\/(.+)$/);

        if (!pathMatch) {
            throw new Error('Invalid banner URL format');
        }

        const filePath = `trip-banners/${pathMatch[1]}`;

        const { error } = await supabase.storage
            .from('trip-banners')
            .remove([filePath]);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting trip banner:', error);
        throw error;
    }
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Formato no válido. Usa JPG, PNG o WebP.' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'Archivo muy grande. Máximo 5MB.' };
    }

    return { valid: true };
}
