/**
 * In-Memory Query & Data Cache with Stale-While-Revalidate (SWR) support.
 * 
 * Provides instantaneous UI transitions across tabs and screens by returning
 * cached data synchronously, while asynchronously revalidating in the background.
 */

interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
}

class QueryCache {
    private cache = new Map<string, CacheEntry>();
    private inflight = new Map<string, Promise<any>>();
    private listeners = new Map<string, Set<(data: any) => void>>();

    // Default freshness TTL: 60 seconds (data is considered fresh and doesn't trigger background refetch)
    // Stale data is still returned instantly, and revalidated in background.
    private defaultFreshnessMs = 60 * 1000;

    /**
     * Retrieve cached item synchronously.
     */
    get<T>(key: string, freshnessMs: number = this.defaultFreshnessMs): { data: T; isFresh: boolean } | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const age = Date.now() - entry.timestamp;
        const isFresh = age < freshnessMs;

        return {
            data: entry.data as T,
            isFresh,
        };
    }

    /**
     * Store data in cache and notify subscribers.
     */
    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });

        // Notify any active subscribers
        const subs = this.listeners.get(key);
        if (subs) {
            subs.forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error('[QueryCache] Listener error:', e);
                }
            });
        }
    }

    /**
     * Helper to execute a query with caching & deduplication of in-flight promises.
     */
    async fetchWithCache<T>(
        key: string,
        fetcher: () => Promise<T>,
        options?: {
            forceRefetch?: boolean;
            freshnessMs?: number;
            onBackgroundUpdate?: (data: T) => void;
        }
    ): Promise<T> {
        const freshness = options?.freshnessMs ?? this.defaultFreshnessMs;
        const cached = this.get<T>(key, freshness);

        // If data exists and is fresh, and not forced, return cached immediately
        if (cached && cached.isFresh && !options?.forceRefetch) {
            return cached.data;
        }

        // If we have existing cached data (stale), return cached data and revalidate in background
        if (cached && !options?.forceRefetch && options?.onBackgroundUpdate) {
            // Background revalidation
            this.executeFetch(key, fetcher)
                .then(freshData => {
                    options.onBackgroundUpdate?.(freshData);
                })
                .catch(err => {
                    console.warn(`[QueryCache] Background revalidation failed for ${key}:`, err);
                });

            return cached.data;
        }

        // Deduplicate in-flight requests
        return this.executeFetch(key, fetcher);
    }

    private async executeFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        if (this.inflight.has(key)) {
            return this.inflight.get(key) as Promise<T>;
        }

        const promise = fetcher()
            .then(data => {
                this.set(key, data);
                return data;
            })
            .finally(() => {
                this.inflight.delete(key);
            });

        this.inflight.set(key, promise);
        return promise;
    }

    /**
     * Invalidate one or more cache keys.
     * Supports exact match or prefix match with trailing asterisk (e.g. 'passenger:*')
     */
    invalidate(keyOrPrefix: string): void {
        if (keyOrPrefix.endsWith('*')) {
            const prefix = keyOrPrefix.slice(0, -1);
            for (const k of this.cache.keys()) {
                if (k.startsWith(prefix)) {
                    this.cache.delete(k);
                }
            }
        } else {
            this.cache.delete(keyOrPrefix);
        }
    }

    /**
     * Clear the entire cache (useful on logout).
     */
    clear(): void {
        this.cache.clear();
        this.inflight.clear();
    }

    /**
     * Subscribe to updates for a specific cache key.
     */
    subscribe(key: string, callback: (data: any) => void): () => void {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        const set = this.listeners.get(key)!;
        set.add(callback);

        return () => {
            set.delete(callback);
            if (set.size === 0) {
                this.listeners.delete(key);
            }
        };
    }
}

export const queryCache = new QueryCache();
