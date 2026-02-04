/**
 * Performance & Cache Manager
 * In-memory LRU Cache and performance utilities
 */

export interface CacheEntry<T> {
    value: T;
    expires: number;
    hits: number;
}

export interface CacheConfig {
    maxSize?: number;       // Maximum items in cache
    ttl?: number;           // Time to live in ms (default 5 minutes)
}

export class CacheManager {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private config: Required<CacheConfig>;
    private stats = {
        hits: 0,
        misses: 0,
        evictions: 0
    };

    constructor(config: CacheConfig = {}) {
        this.config = {
            maxSize: config.maxSize ?? 100,
            ttl: config.ttl ?? 5 * 60 * 1000 // 5 Minutes
        };
    }

    /**
     * Get item from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        entry.hits++;
        this.stats.hits++;
        return entry.value as T;
    }

    /**
     * Set item in cache
     */
    set<T>(key: string, value: T, ttl?: number): void {
        // Eviction policy (LRU-like: delete oldest if full)
        if (this.cache.size >= this.config.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
                this.stats.evictions++;
            }
        }

        const expires = Date.now() + (ttl ?? this.config.ttl);
        this.cache.set(key, { value, expires, hits: 0 });
    }

    /**
     * Clear cache
     */
    clear(): void {
        this.cache.clear();
        this.resetStats();
    }

    /**
     * Get performance stats
     */
    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            ratio: this.stats.hits / (this.stats.hits + this.stats.misses || 1)
        };
    }

    private resetStats() {
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }

    /**
     * Debounce utility
     */
    static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: any;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
}

export default CacheManager;
