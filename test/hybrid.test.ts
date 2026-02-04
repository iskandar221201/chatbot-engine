import { describe, it, expect } from 'vitest';
import { ExperimentManager } from '../src/lib/experiment-manager';
import { HybridAI } from '../src/lib/llm-connector';

describe('ExperimentManager', () => {
    it('should consistently assign variants', () => {
        // User A always sees Control
        const managerA = new ExperimentManager('user-a');
        managerA.register('price-test', ['control', 'variant-b']);
        const v1 = managerA.getVariant('price-test');
        const v2 = managerA.getVariant('price-test');
        expect(v1).toBe(v2);
    });

    it('should distribute variants based on weights', () => {
        // Mock simple distribution check
        // Ideally this needs statistical test, conducting simple deterministic check
        const manager = new ExperimentManager('user-1');
        manager.register('test', ['A', 'B'], [100, 0]); // Always A
        expect(manager.getVariant('test')).toBe('A');

        const manager2 = new ExperimentManager('user-2');
        manager2.register('test2', ['A', 'B'], [0, 100]); // Always B
        expect(manager2.getVariant('test2')).toBe('B');
    });

    it('should return config based on variant', () => {
        const manager = new ExperimentManager('user-val');
        manager.register('color-test', ['blue', 'red'], [100, 0]);

        const config = manager.getConfig('color-test', {
            blue: { color: '#00F' },
            red: { color: '#F00' }
        });

        expect(config.color).toBe('#00F');
    });
});

describe('HybridAI', () => {
    it('should initialize with default provider', () => {
        const hybrid = new HybridAI({ apiKey: 'sk-test' });
        expect(hybrid).toBeDefined();
    });

    it('should return null if no provider', async () => {
        const hybrid = new HybridAI();
        const res = await hybrid.fallback('query');
        expect(res).toBeNull();
    });

    it('should use provider to generate response', async () => {
        const mockProvider = {
            name: 'mock',
            generateResponse: async () => 'Mock Response'
        };

        const hybrid = new HybridAI({ provider: mockProvider });
        const res = await hybrid.fallback('query');
        expect(res).toBe('Mock Response');
    });
});
