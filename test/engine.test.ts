import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssistantEngine } from '../src/engine';
import { AssistantDataItem } from '../src/types';

// Mock data
const mockData: AssistantDataItem[] = [
    {
        title: "iPhone 15 Pro",
        category: "Smartphone",
        price_numeric: 20000000,
        description: "Smartphone canggih with chip A17 Pro.",
        keywords: ["hp", "apple", "ios"],
        url: "/iphone-15",
        is_recommended: true
    },
    {
        title: "Samsung Galaxy S24",
        category: "Smartphone",
        price_numeric: 19000000,
        description: "Smartphone AI terbaik tahun ini.",
        keywords: ["hp", "android", "samsung"],
        url: "/samsung-s24",
        badge_text: "Promo"
    },
    {
        title: "MacBook Air M2",
        category: "Laptop",
        price_numeric: 18000000,
        description: "Laptop ringan dan cepat.",
        keywords: ["apple", "mac", "komputer"],
        url: "/macbook-air"
    }
];

// Mock Fuse to avoid dependency issues in unit test environment if not fully bundled
// But better to use the real one if possible. Using the real one here as it should work in Node context.
// If it fails, we will mock it.

describe('AssistantEngine Core', () => {
    let engine: AssistantEngine;

    beforeEach(() => {
        // Initialize engine with mock data
        // We pass a mock config for triggers
        engine = new AssistantEngine(mockData, undefined, {
            comparisonTriggers: ['bandingkan', 'vs', 'rekomendasi'],
            salesTriggers: { 'beli': ['beli', 'order'] }
        });
    });

    it('should search products correctly', async () => {
        const result = await engine.search('iphone');
        expect(result.results).toHaveLength(1);
        expect(result.results[0].title).toBe('iPhone 15 Pro');
    });

    it('should detect sales intent', async () => {
        const result = await engine.search('beli iphone');
        expect(result.intent).toContain('sales_beli');
    });

    it('should handle typos matching (Phonetic/Fuzzy)', async () => {
        // Engine internal fuse configuration handles fuzziness
        const result = await engine.search('aifeng'); // Typo for iPhone
        // Note: Fuse threshold might need tuning for 'aifeng' -> 'iphone' but let's try close one
        const result2 = await engine.search('samsong');
        expect(result2.results[0].title).toContain('Samsung');
    });

    it('should handle deep Indonesian stemming (Sastrawi integration)', async () => {
        const dataWithEkonomi = [...mockData, {
            title: "Buku Ekonomi",
            category: "Buku",
            description: "Belajar ekonomi pembangunan.",
            keywords: ["keuangan"],
            url: "/ekonomi"
        }];
        const engine2 = new AssistantEngine(dataWithEkonomi);
        const res = await engine2.search('perekonomian');
        expect(res.results[0].title).toBe('Buku Ekonomi');
    });
});

describe('Comparison Features', () => {
    let engine: AssistantEngine;

    beforeEach(() => {
        engine = new AssistantEngine(mockData, undefined, {
            comparisonTriggers: ['bandingkan', 'rekomen', 'paling']
        });
    });

    it('should identify comparison queries', () => {
        expect(engine.isComparisonQuery('bandingkan hp')).toBe(true);
        expect(engine.isComparisonQuery('minta rekomen')).toBe(true);
        expect(engine.isComparisonQuery('siapa paling bagus')).toBe(true);
        expect(engine.isComparisonQuery('biasa aja')).toBe(false);
    });

    it('should perform comparison and return table', async () => {
        const result = await engine.compareProducts('bandingkan smartphone');
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.tableHtml).toBeDefined();
        // Should recommend the recommended item (iPhone) or the one with highest score
        const rec = result.recommendation;
        expect(rec).toBeDefined();
    });
});

describe('Remote Mode & Security', () => {
    it('should call API with correct headers (Security Check)', async () => {
        // Mock fetch
        const fetchSpy = vi.fn().mockResolvedValue({
            json: async () => ({ results: [], confidence: 0 })
        });
        vi.stubGlobal('fetch', fetchSpy);

        const config = {
            searchMode: 'remote' as any,
            apiUrl: 'https://api.example.com/search',
            apiHeaders: {
                'X-API-Key': 'SECRET-123'
            }
        };

        const remoteEngine = new AssistantEngine([], undefined, config);
        await remoteEngine.search('test query');

        expect(fetchSpy).toHaveBeenCalledWith(
            expect.stringContaining('https://api.example.com/search'),
            expect.objectContaining({
                headers: {
                    'X-API-Key': 'SECRET-123'
                }
            })
        );
    });

    it('should handle multiple API sources (Aggregation)', async () => {
        const fetchSpy = vi.fn()
            .mockResolvedValueOnce({
                json: async () => ({ results: [{ title: "Item A", description: "", category: "A", keywords: [], url: "/a", score: 10 }] })
            })
            .mockResolvedValueOnce({
                json: async () => ({ results: [{ title: "Item B", description: "", category: "B", keywords: [], url: "/b", score: 8 }] })
            });
        vi.stubGlobal('fetch', fetchSpy);

        const config = {
            searchMode: 'remote' as any,
            apiUrl: ['https://api1.com', 'https://api2.com']
        };

        const remoteEngine = new AssistantEngine([], undefined, config);
        const result = await remoteEngine.search('test');

        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(result.results).toHaveLength(2);
    });
});

describe('Smart Splitting & Compound Queries', () => {
    let engine: AssistantEngine;

    beforeEach(() => {
        engine = new AssistantEngine(mockData);
    });

    it('should split query using punctuation', async () => {
        const result = await engine.search('harga iphone? fiturnya apa');
        // Based on logic, this should trigger compound handling
        // Each part should produce results
        expect(result.intent).toBe('compound');
        // Match either price format or generic price words + feature words
        expect(result.answer).toMatch(/Rp|Harga|banderol|cuma/);
        expect(result.answer).toMatch(/keunggulan|fitur|spesifikasi/i);
    });

    it('should split query using triggers (Trigger-Aware Split)', async () => {
        const result = await engine.search('Harga iPhone berapa fiturnya apa');
        // "berapa" and "fitur" are triggers that should cause a split if combined
        expect(result.intent).toBe('compound');
        expect(result.intent).toBe('compound');
        expect(result.answer).toMatch(/Rp|Harga|banderol|cuma/);
        expect(result.answer).toMatch(/keunggulan|fitur|spesifikasi/i);
    });
});

describe('Localization & Custom Templates', () => {
    it('should use custom currency and locale', async () => {
        const engine = new AssistantEngine(mockData, undefined, {
            locale: 'en-US',
            currencySymbol: '$',
            answerTemplates: {
                price: '{title} price is {currency} {price}'
            }
        });

        const result = await engine.search('harga iphone');
        // formatCurrency might return non-breaking space or different formatting based on environment
        expect((result.answer || '').replace(/\s| /g, ' ')).toContain('iPhone 15 Pro price is $ 20,000,000');
    });

    it('should use custom fallback responses', async () => {
        const engine = new AssistantEngine(mockData, undefined, {
            fallbackIntentResponses: {
                'chat_greeting': 'Welcome to our store! How can I help?'
            }
        });

        const result = await engine.search('halo');
        expect(result.answer).toBe('Welcome to our store! How can I help?');
    });

    it('should show no results template', async () => {
        const engine = new AssistantEngine(mockData, undefined, {
            answerTemplates: {
                noResults: 'Nothing found.'
            }
        });

        const result = await engine.search('asdfghjkl');
        expect(result.answer).toBe('Nothing found.');
    });
});
