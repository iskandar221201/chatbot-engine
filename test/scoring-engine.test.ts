import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringEngine } from '../src/lib/scoring-engine';

describe('ScoringEngine Sub-Engine', () => {
    let scoring: ScoringEngine;

    beforeEach(() => {
        scoring = new ScoringEngine();
    });

    it('should calculate basic relevance scores', () => {
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

        const score = scoring.calculate(item as any, processed, 0.1, 'fuzzy', {});
        expect(score).toBeGreaterThan(0);
    });

    it('should boost score for matching category', () => {
        const item = { title: 'X', category: 'Gadget', url: '/x', attributes: {} };
        const processed = { tokens: ['gadget'], expanded: ['gadget'] };
        const score = scoring.calculate(item as any, processed, 0.5, 'fuzzy', {});
        expect(score).toBeGreaterThan(25); // Should have category boost
    });

    it('should boost score for urgent intent and stock availability', () => {
        const item = { title: 'Y', category: 'Stok Ready', url: '/y', attributes: {} };
        const processed = { tokens: ['y'], expanded: ['y'], signals: { isUrgent: true } };
        const score = scoring.calculate(item as any, processed, 0.5, 'fuzzy', {});
        expect(score).toBeGreaterThan(30);
    });

    it('should calculate dice coefficient accurately', () => {
        const dice = scoring.calculateDiceCoefficient('makan', 'makanan');
        expect(dice).toBeGreaterThan(0.5);
        expect(dice).toBeLessThan(1.0);
    });
});
