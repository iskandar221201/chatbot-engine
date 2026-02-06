import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringEngine } from '../src/lib/scoring-engine';

describe('ScoringEngine Sub-Engine', () => {
    let scoring: ScoringEngine;

    beforeEach(() => {
        scoring = new ScoringEngine();
    });

    it('should calculate basic relevance scores and provide breakdown', () => {
        const item = {
            title: 'Samsung Galaxy',
            category: 'Smartphone',
            description: 'HP canggih',
            url: '/samsung',
            attributes: {},
            keywords: ['hp', 'samsung']
        };

        const processed = {
            tokens: ['samsung', 'hp'],
            expanded: ['samsung', 'hp'],
            signals: { isUrgent: false }
        };

        const result = scoring.calculate(item as any, processed, 0.1, 'fuzzy', {});
        expect(result.score).toBeGreaterThan(0);
        expect(result.breakdown).toBeDefined();
        expect(result.breakdown.fuzzyMatch).toBeGreaterThan(0);
    });

    it('should boost score for matching category', () => {
        const item = { title: 'X', category: 'Gadget', url: '/x', attributes: {}, keywords: [] };
        const processed = { tokens: ['gadget'], expanded: ['gadget'] };
        const result = scoring.calculate(item as any, processed, 0.5, 'fuzzy', { lastCategory: '' });
        // New scoring: fieldBoost is 15. Total might be around 20 (fuzzy + field + token).
        expect(result.score).toBeGreaterThan(15);
        expect(result.breakdown.fieldBoost).toBeGreaterThan(0);
    });

    it('should boost score for urgent intent and stock availability', () => {
        const item = { title: 'Y', category: 'Stok Ready', url: '/y', attributes: {} };
        const processed = { tokens: ['y'], expanded: ['y'], signals: { isUrgent: true } };
        const result = scoring.calculate(item as any, processed, 0.5, 'fuzzy', {});
        expect(result.score).toBeGreaterThan(30);
        expect(result.breakdown.intentBoost).toBeGreaterThan(0);
    });

    it('should calculate dice coefficient accurately', () => {
        const dice = scoring.calculateDiceCoefficient('makan', 'makanan');
        expect(dice).toBeGreaterThan(0.5);
        expect(dice).toBeLessThan(1.0);
    });

    it('should provide transparent scoring breakdown', () => {
        const item = {
            title: 'Samsung S23',
            category: 'Premium Phone',
            url: '/s23',
            is_recommended: true,
            attributes: {}
        };
        const processed = {
            tokens: ['samsung'],
            expanded: ['samsung'],
            signals: { isUrgent: false }
        };
        const result = scoring.calculate(item as any, processed, 0.1, 'sales_query', {});

        expect(result.breakdown.psychologyBoost).toBe(25); // is_recommended boost (updated val from 30 to 25)
        expect(result.breakdown.fuzzyMatch).toBe(9); // (1 - 0.1) * 10
    });
});
