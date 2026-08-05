import { supabase } from '../lib/supabase';

/**
 * Load image using the most efficient and robust method available
 * Supports mobile camera photos, high-res images, and various formats
 */
async function loadDrawableImage(file: File): Promise<{
    width: number;
    height: number;
    draw: (ctx: CanvasRenderingContext2D, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => void;
    cleanup: () => void;
}> {
    // 1. Try modern createImageBitmap first (hardware accelerated, handles orientation automatically)
    if (typeof createImageBitmap === 'function') {
        try {
            // Some browsers support imageOrientation option
            let bitmap: ImageBitmap;
            try {
                bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' as any });
            } catch {
                bitmap = await createImageBitmap(file);
            }

            return {
                width: bitmap.width,
                height: bitmap.height,
                draw: (ctx, sx, sy, sw, sh, dx, dy, dw, dh) => {
                    ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
                },
                cleanup: () => {
                    try {
                        bitmap.close();
                    } catch {
                        // ignore
                    }
                },
            };
        } catch (bitmapError) {
            console.warn('createImageBitmap failed, falling back to Image object URL:', bitmapError);
        }
    }

    // 2. Fallback to URL.createObjectURL (avoids memory duplication and stream reading issues on mobile)
    return new Promise((resolve, reject) => {
        let objectUrl: string | null = null;
        try {
            objectUrl = URL.createObjectURL(file);
        } catch (urlErr) {
            console.warn('createObjectURL failed, falling back to FileReader:', urlErr);
        }

        if (objectUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            const cleanup = () => {
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                    objectUrl = null;
                }
            };

            img.onload = () => {
                resolve({
                    width: img.naturalWidth || img.width,
                    height: img.naturalHeight || img.height,
                    draw: (ctx, sx, sy, sw, sh, dx, dy, dw, dh) => {
                        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
                    },
                    cleanup,
                });
            };

            img.onerror = () => {
                cleanup();
                // If objectUrl fails on this image, fallback to FileReader
                fallbackFileReader(file).then(resolve).catch(reject);
            };

            img.src = objectUrl;
            return;
        }

        // 3. Fallback to FileReader
        fallbackFileReader(file).then(resolve).catch(reject);
    });
}

function fallbackFileReader(file: File): Promise<{
    width: number;
    height: number;
    draw: (ctx: CanvasRenderingContext2D, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => void;
    cleanup: () => void;
}> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.naturalWidth || img.width,
                    height: img.naturalHeight || img.height,
                    draw: (ctx, sx, sy, sw, sh, dx, dy, dw, dh) => {
                        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
                    },
                    cleanup: () => {},
                });
            };
            img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
            img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
        reader.readAsDataURL(file);
    });
}

/**
 * Compress and resize a profile image to 400x400px
 * @param file - Original image file
 * @param maxSize - Maximum dimension (default 400px for profile photos)
 * @param quality - JPEG quality 0-1 (default 0.82)
 * @returns Compressed image file
 */
export async function compressProfileImage(
    file: File,
    maxSize: number = 400,
    quality: number = 0.82
): Promise<File> {
    const drawable = await loadDrawableImage(file);

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('No se pudo inicializar el contexto de imagen');
        }

        // Calculate square crop from center
        const size = Math.min(drawable.width, drawable.height);
        const x = (drawable.width - size) / 2;
        const y = (drawable.height - size) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;

        // Fill background with white in case of transparent PNG/WebP
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, maxSize, maxSize);

        // Draw square crop scaled to maxSize with smooth image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawable.draw(ctx, x, y, size, size, 0, 0, maxSize, maxSize);

        return new Promise<File>((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('No se pudo comprimir la imagen'));
                        return;
                    }
                    const compressedFile = new File([blob], 'avatar.jpg', {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                },
                'image/jpeg',
                quality
            );
        });
    } finally {
        drawable.cleanup();
    }
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
        // Compress and resize image first
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
                upsert: true,
                contentType: 'image/jpeg',
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(data.path);

        return publicUrl;
    } catch (error: any) {
        console.error('Error uploading profile photo:', error);
        throw new Error(error.message || 'Error al subir la foto');
    }
}

/**
 * Delete profile photo from Storage
 * @param photoUrl - Full URL of the photo to delete
 */
export async function deleteProfilePhoto(photoUrl: string): Promise<void> {
    try {
        const url = new URL(photoUrl);
        const pathMatch = url.pathname.match(/\/profile-photos\/(.+)$/);
        if (!pathMatch) {
            return;
        }
        const filePath = pathMatch[1];

        const { error } = await supabase.storage
            .from('profile-photos')
            .remove([filePath]);

        if (error) {
            console.warn('Could not remove old profile photo from storage:', error.message);
        }
    } catch (error: any) {
        console.warn('Error deleting profile photo:', error.message);
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
    // Smartphone camera photos can be up to 15MB before client-side compression
    const maxSize = 15 * 1024 * 1024; // 15MB
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.bmp', '.jfif'];
    const fileName = (file.name || '').toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));

    const isImageMime = !file.type || file.type.startsWith('image/');

    if (!isImageMime && !hasValidExt) {
        return {
            valid: false,
            error: 'Formato no permitido. Por favor seleccioná una imagen (JPG, PNG o WebP).',
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'La imagen supera los 15MB. Por favor seleccioná una foto más liviana.',
        };
    }

    return { valid: true };
}
