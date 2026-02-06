import { supabase } from '../lib/supabase';

/**
 * Compress and resize a profile image to 400x400px
 * @param file - Original image file
 * @param maxSize - Maximum dimension (default 400px for profile photos)
 * @param quality - JPEG quality 0-1 (default 0.8)
 * @returns Compressed image file
 */
export async function compressProfileImage(
    file: File,
    maxSize: number = 400,
    quality: number = 0.8
): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Calculate dimensions (square crop from center)
                const size = Math.min(img.width, img.height);
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;

                canvas.width = maxSize;
                canvas.height = maxSize;

                // Draw square crop scaled to maxSize
                ctx.drawImage(img, x, y, size, size, 0, 0, maxSize, maxSize);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Could not compress image'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Could not load image'));
        };
        reader.onerror = () => reject(new Error('Could not read file'));
    });
}

/**
 * Upload profile photo to Supabase Storage
 * @param passengerId - Passenger ID
 * @param file - Image file to upload
 * @returns Public URL of uploaded image
 */
export async function uploadProfilePhoto(
    passengerId: string,
    file: File
): Promise<string> {
    try {
        // Compress image first
        const compressedFile = await compressProfileImage(file);

        // Generate unique filename
        const fileExt = 'jpg'; // Always JPG after compression
        const fileName = `${passengerId}-${Date.now()}.${fileExt}`;
        const filePath = `${passengerId}/${fileName}`;

        // Upload to storage
        const { data, error } = await supabase.storage
            .from('profile-photos')
            .upload(filePath, compressedFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(data.path);

        return publicUrl;
    } catch (error: any) {
        console.error('Error uploading profile photo:', error);
        throw new Error(`Failed to upload photo: ${error.message}`);
    }
}

/**
 * Delete profile photo from Storage
 * @param photoUrl - Full URL of the photo to delete
 */
export async function deleteProfilePhoto(photoUrl: string): Promise<void> {
    try {
        // Extract path from URL
        const url = new URL(photoUrl);
        const pathMatch = url.pathname.match(/\/profile-photos\/(.+)$/);
        if (!pathMatch) {
            throw new Error('Invalid photo URL');
        }
        const filePath = pathMatch[1];

        const { error } = await supabase.storage
            .from('profile-photos')
            .remove([filePath]);

        if (error) throw error;
    } catch (error: any) {
        console.error('Error deleting profile photo:', error);
        throw new Error(`Failed to delete photo: ${error.message}`);
    }
}

/**
 * Validate image file before upload
 * @param file - File to validate
 * @returns Validation result
 */
export function validateProfileImage(file: File): {
    valid: boolean;
    error?: string;
} {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Formato no permitido. Usa JPG, PNG o WebP.',
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'La imagen es muy grande. Máximo 2MB.',
        };
    }

    return { valid: true };
}
