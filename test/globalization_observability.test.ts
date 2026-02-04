import { describe, it, expect, beforeEach } from 'vitest';
import { AssistantEngine } from '../src/engine';
import { EnglishProvider, IndonesianProvider } from '../src/lib/language-providers';

describe('Globalization & Observability Integration', () => {
    const sampleData = [
        {
            title: 'Gaming Laptop',
            description: 'Powerful gaming laptop with RTX 4090',
            category: 'Laptops',
            url: '/laptop',
            keywords: ['gaming', 'laptop', 'rtx']
        },
        {
            title: 'Laptop Gaming',
            description: 'Laptop gaming kencang dengan RTX 4090',
            category: 'Laptop',
            url: '/laptop-id',
            keywords: ['gaming', 'laptop']
        }
    ];

    it('should use EnglishProvider when locale is set to en', async () => {
        const engine = new AssistantEngine(sampleData, undefined, { locale: 'en' });
        const result = await engine.search('gaming laptops');

        // English stemming: 'laptops' -> 'laptop'
        expect(result.results[0].title).toBe('Gaming Laptop');
        // Check diagnostic existence
        expect(result.diagnostics).toBeDefined();
        expect(result.diagnostics!.some(d => d.id === 'preprocessing')).toBe(true);
    });

    it('should provide deep diagnostics for a search query', async () => {
        const engine = new AssistantEngine(sampleData);
        const result = await engine.search('laptop gaming');

        expect(result.diagnostics).toBeDefined();
        const preprocessing = result.diagnostics!.find(d => d.id === 'preprocessing');
        const scoring = result.diagnostics!.find(d => d.id === 'scoring');

        expect(preprocessing).toBeDefined();
        expect(preprocessing!.duration).toBeGreaterThanOrEqual(0);
        expect(scoring).toBeDefined();
        expect(scoring!.meta?.finalCandidateCount).toBeGreaterThan(0);
    });

    it('should correctly switch providers manually', () => {
        const idProvider = new IndonesianProvider();
        const enProvider = new EnglishProvider();

        expect(idProvider.stem('makanan')).toBe('makan');
        expect(enProvider.stem('running')).toBe('run');
    });

    it('should include diagnostic breakdown in compound queries', async () => {
        const engine = new AssistantEngine(sampleData);
        const result = await engine.search('mencari laptop dan gaming');

        expect(result.intent).toBe('compound');
        expect(result.diagnostics).toBeDefined();
        // Compound queries should have aggregated diagnostics
        expect(result.diagnostics!.length).toBeGreaterThan(5);
    });
});
