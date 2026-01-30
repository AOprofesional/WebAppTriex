import { useState, useEffect, useCallback } from 'react';
import { getSignedUrl } from '../lib/storageHelpers';

interface UseSignedUrlParams {
    bucket: 'documents' | 'vouchers';
    filePath: string | null;
    enabled?: boolean;
}

export function useSignedUrl({ bucket, filePath, enabled = true }: UseSignedUrlParams) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSignedUrl = useCallback(async () => {
        if (!filePath || !enabled) {
            setUrl(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const signedUrl = await getSignedUrl(bucket, filePath);
            setUrl(signedUrl);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to get signed URL';
            setError(msg);
            setUrl(null);
        } finally {
            setLoading(false);
        }
    }, [bucket, filePath, enabled]);

    useEffect(() => {
        fetchSignedUrl();

        // Refrescar URL cada 8 minutos (antes de que expire a los 10 min)
        if (filePath && enabled) {
            const interval = setInterval(() => {
                fetchSignedUrl();
            }, 8 * 60 * 1000); // 8 minutos

            return () => clearInterval(interval);
        }
    }, [fetchSignedUrl, filePath, enabled]);

    const refresh = useCallback(() => {
        fetchSignedUrl();
    }, [fetchSignedUrl]);

    return { url, loading, error, refresh };
}
