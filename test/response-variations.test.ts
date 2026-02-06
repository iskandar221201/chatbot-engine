import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResponseEngine } from '../src/lib/response-engine';
import { SalesPsychology } from '../src/lib/sales-psychology';
import { DEFAULT_UI_CONFIG } from '../src/defaults';

describe('ResponseEngine - Natural Variations', () => {
    let responseEngine: ResponseEngine;
    let mockPsychology: SalesPsychology;

    beforeEach(() => {
        mockPsychology = {
            getObjectionPrefix: () => '',
            getClosingQuestion: () => '',
        } as any;

        responseEngine = new ResponseEngine({
            currencySymbol: 'Rp',
            locale: 'id-ID'
        }, mockPsychology);
    });

    it('should select random templates for pricing', () => {
        const item = {
            title: 'Botol Minum',
            price_numeric: 50000,
            description: 'Botol bagus',
            url: '',
            category: 'Alat'
        };
        const result = {
            results: [item],
            intent: 'sales_harga',
            entities: {},
            confidence: 90
        };

        const answers = new Set();
        for (let i = 0; i < 20; i++) {
            answers.add(responseEngine.compose(result as any, 'sales_harga', false, () => ({})));
        }

        // With 4 variations, running 20 times should produce at least 2 different answers definitely
        expect(answers.size).toBeGreaterThan(1);
    });

    it('should assemble dynamic description when no specific intent', () => {
        const item = {
            title: 'Laptop Gaming',
            category: 'Elektronik',
            sale_price: 15000000,
            description: 'Laptop kencang',
            url: '',
            keywords: [],
            scoreBreakdown: {}
        };
        const result = {
            results: [item],
            intent: 'unknown_intent', // Should trigger dynamic assembly
            entities: {},
            confidence: 80
        };

        const attributes = { 'fitur': 'RTX 4060' };
        const answer = responseEngine.compose(result as any, 'unknown_intent', false, () => attributes);

        expect(answer).toContain('Laptop Gaming');
        expect(answer).toContain('Elektronik');
        expect(answer).toContain('15.0Jt'); // Formatted price (abbreviated)
        expect(answer).toContain('keunggulan berupa RTX 4060');
    });

    it('should use variations for No Results', () => {
        const result = {
            results: [],
            intent: 'unknown',
            entities: {},
            confidence: 0
        };

        const answers = new Set();
        for (let i = 0; i < 20; i++) {
            answers.add(responseEngine.compose(result as any, 'unknown', false, () => ({})));
        }

        expect(answers.size).toBeGreaterThan(1);
    });
});
