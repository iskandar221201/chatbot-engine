import { describe, it, expect, beforeEach } from 'vitest';
import { PreprocessingEngine } from '../src/lib/preprocessing-engine';

describe('PreprocessingEngine Sub-Engine', () => {
    let prepro: PreprocessingEngine;

    beforeEach(() => {
        prepro = new PreprocessingEngine({
            phoneticMap: {
                'samsung': ['samsong', 'shamsung'],
                'apple': ['aple', 'epel']
            },
            semanticMap: {
                'ponsel': ['hp', 'smartphone'],
                'biaya': ['harga', 'ongkos']
            },
            entityDefinitions: {
                'brand': ['samsung', 'apple', 'sony'],
                'action': ['beli', 'order', 'pesan']
            },
            // Note: DEFAULT_STOP_WORDS includes 'berapa' and 'itu'
            stopWords: ['adalah', 'yang']
        });
    });

    it('should normalize text and clean punctuation', () => {
        const result = prepro.process('Berapa harga iPhone itu?');
        // 'berapa' is a stop word in defaults, but we overrode stopWords in beforeEach to NOT include 'berapa'
        expect(result.tokens).toContain('berapa');
        expect(result.tokens).toContain('harga');
        expect(result.signals.isQuestion).toBe(true);
    });

    it('should handle phonetic auto-correction', () => {
        const corrected = prepro.autoCorrect('samsong');
        expect(corrected).toBe('samsung');

        const result = prepro.process('beli samsong');
        expect(result.tokens).toContain('samsung');
    });

    it('should perform Indonesian stemming (Sastrawi integration)', async () => {
        // Initialize the lazy-loaded Sastrawi stemmer
        const provider = (prepro as any).provider;
        if (provider?.init) await provider.init();

        const stem = prepro.stem('menjual');
        expect(stem).toBe('jual');

        const result = prepro.process('saya menjual hp');
        expect(result.tokens).toContain('jual');
    });

    it('should expand tokens semantically (synonyms)', () => {
        const result = prepro.process('berapa harga ponsel');
        expect(result.expanded).toContain('smartphone');
        expect(result.expanded).toContain('hp');
    });

    it('should detect entities correctly', () => {
        const result = prepro.process('saya mau beli samsung');
        expect(result.entities.brand).toBe(true);
        expect(result.entities.action).toBe(true);
    });

    it('should extract attributes from content', () => {
        const item = {
            title: 'Test',
            description: 'Warna: Merah, Ukuran: XL',
            category: 'Fashion',
            url: '/test',
            attributes: {}
        };
        const attributes = prepro.extractAttributes(item as any);
        // Default extractors use Indonesian keys: 'warna', 'ukuran'
        expect(attributes.warna || attributes.Warna).toBeDefined();
        expect(attributes.warna).toBe('Merah');
    });
});
