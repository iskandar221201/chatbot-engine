import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseEngine } from '../src/lib/response-engine';
import { SalesPsychology } from '../src/lib/sales-psychology';
import { AssistantResult } from '../src/types';

describe('ResponseEngine Sub-Engine', () => {
    let re: ResponseEngine;
    let sp: SalesPsychology;

    beforeEach(() => {
        sp = new SalesPsychology();
        re = new ResponseEngine({
            answerTemplates: {
                price: "Harga {title} adalah {price}",
                features: "Fitur {title}: {features}",
                noResults: "Maaf, tidak ada hasil."
            },
            locale: 'id-ID',
            currencySymbol: 'IDR'
        }, sp);
    });

    it('should format price correctly using templates', () => {
        const result: AssistantResult = {
            results: [{ title: 'Produk X', price_numeric: 100000, category: 'Gadget', url: '/x' } as any],
            intent: 'sales_harga',
            entities: {},
            confidence: 90
        };

        const answer = re.compose(result, 'sales_harga', false, () => ({}));
        expect(answer).toContain('Produk X');
        expect(answer).toContain('100.000');
    });

    it('should format features correctly using templates', () => {
        const result: AssistantResult = {
            results: [{ title: 'Produk Y', description: 'Deskripsi hebat', category: 'Gadget', url: '/y' } as any],
            intent: 'sales_fitur',
            entities: {},
            confidence: 90
        };

        const answer = re.compose(result, 'sales_fitur', false, () => ({}));
        expect(answer).toBe('Fitur Produk Y: Deskripsi hebat');
    });

    it('should apply sentiment prefixes for high intensity positive sentiment', () => {
        const result: AssistantResult = {
            results: [{ title: 'Produk Z', answer: 'Hasil pencarian', category: 'Gadget', url: '/z' } as any],
            intent: 'fuzzy',
            entities: {},
            confidence: 90,
            sentiment: {
                score: 5,
                label: 'positive',
                isUrgent: false,
                intensity: 'high'
            }
        };

        re = new ResponseEngine({
            sentimentPrefixes: {
                positive: ["Wah! "]
            }
        }, sp);

        const answer = re.compose(result, 'fuzzy', true, () => ({}));
        expect(answer).toMatch(/^Wah!/);
    });

    it('should apply objection prefixes for negative sentiment', () => {
        const baseAnswer = 'Ada kendala';
        const result: AssistantResult = {
            results: [{ title: 'Produk Error', answer: baseAnswer, category: 'Gadget', url: '/e' } as any],
            intent: 'fuzzy',
            entities: {},
            confidence: 90,
            sentiment: {
                score: -5,
                label: 'negative',
                isUrgent: false,
                intensity: 'high'
            }
        };

        const answer = re.compose(result, 'fuzzy', true, () => ({}));
        expect(answer.length).toBeGreaterThan(baseAnswer.length);
        expect(answer).toContain(baseAnswer);
    });

    it('should add closing questions for sales_beli intent', () => {
        const baseAnswer = 'Bisa dipesan';
        const result: AssistantResult = {
            results: [{ title: 'Produk Beli', answer: baseAnswer, category: 'Gadget', url: '/b' } as any],
            intent: 'sales_beli',
            entities: {},
            confidence: 95
        };

        const answer = re.compose(result, 'sales_beli', false, () => ({}));
        expect(answer.length).toBeGreaterThan(baseAnswer.length);
        expect(answer).toContain(baseAnswer);
    });
});
