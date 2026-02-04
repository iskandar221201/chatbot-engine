import { describe, it, expect, vi } from 'vitest';
import { AnalyticsEngine } from '../src/lib/analytics';
import { CacheManager } from '../src/lib/cache-manager';

describe('AnalyticsEngine', () => {
    it('should track events', async () => {
        const analytics = new AnalyticsEngine();
        const spy = vi.fn();

        analytics.onEvent(spy);
        analytics.track('search', { query: 'test' });

        // Handler is async (setTimeout 0)
        await new Promise(r => setTimeout(r, 10));

        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0].type).toBe('search');
    });

    it('should aggregate metrics internally', () => {
        const analytics = new AnalyticsEngine();
        analytics.track('search', {});
        analytics.track('search', {});
        analytics.track('lead_captured', {});

        const metrics = analytics.getMetrics();
        expect(metrics.search).toBe(2);
        expect(metrics.lead_captured).toBe(1);
    });

    it('should respect sampling rate', () => {
        // 0% sample rate = no tracking
        const analytics = new AnalyticsEngine({ sampleRate: 0 });
        const spy = vi.fn();
        analytics.onEvent(spy);

        analytics.track('search', {});
        expect(analytics.getMetrics().search).toBeUndefined();
    });
});

describe('CacheManager', () => {
    it('should store and retrieve values', () => {
        const cache = new CacheManager();
        cache.set('key', 'value');
        expect(cache.get('key')).toBe('value');
    });

    it('should expire items based on TTL', async () => {
        const cache = new CacheManager({ ttl: 10 }); // 10ms
        cache.set('key', 'value');

        await new Promise(r => setTimeout(r, 20));
        expect(cache.get('key')).toBeNull();
    });

    it('should evict items when full (LRU)', () => {
        const cache = new CacheManager({ maxSize: 2 });
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3); // Should evict 'a'

        expect(cache.get('a')).toBeNull();
        expect(cache.get('b')).toBe(2);
        expect(cache.get('c')).toBe(3);
    });

    it('should provide stats', () => {
        const cache = new CacheManager();
        cache.set('a', 1);
        cache.get('a'); // Hit
        cache.get('b'); // Miss

        const stats = cache.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.misses).toBe(1);
    });

    it('should debounce function', async () => {
        let count = 0;
        const inc = () => count++;
        const debounced = CacheManager.debounce(inc, 10);

        debounced();
        debounced();
        debounced();

        expect(count).toBe(0);

        await new Promise(r => setTimeout(r, 20));
        expect(count).toBe(1);
    });
});
