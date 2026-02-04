import { describe, it, expect } from 'vitest';
import { SalesPsychology } from '../src/lib/sales-psychology';
import type { AssistantDataItem } from '../src/types';

const mockItems: AssistantDataItem[] = [
    {
        title: 'Gaming Laptop',
        category: 'Laptop',
        description: '',
        url: '',
        price_numeric: 15000000
    },
    {
        title: 'Gaming Mouse',
        category: 'Aksesoris',
        description: '',
        url: '',
        price_numeric: 500000
    },
    {
        title: 'Baju Keren',
        category: 'Fashion',
        description: '',
        url: '',
        price_numeric: 100000
    }
];

describe('SalesPsychology', () => {
    it('should generate FOMO signals', () => {
        const psychology = new SalesPsychology({ fomoThreshold: 20 });
        const signal = psychology.getFomoSignal(mockItems[0]);
        // Since we mock logic based on title length: 'Gaming Laptop'.length = 13.
        // 13 < 20, so it should trigger FOMO
        expect(signal).not.toBeNull();
        expect(signal).toContain('Laris manis');
    });

    it('should generate Social Proof', () => {
        const psychology = new SalesPsychology();
        const proof = psychology.getSocialProof(mockItems[0]);
        expect(proof).not.toBeNull();
    });

    it('should suggest cross-sells logic', () => {
        const psychology = new SalesPsychology();
        // Default rule: Laptop -> Aksesoris
        const suggestions = psychology.getCrossSell(mockItems[0], mockItems);

        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].category).toBe('Aksesoris');
        expect(suggestions[0].title).toBe('Gaming Mouse');
    });

    it('should provide persuasive CTA', () => {
        const psychology = new SalesPsychology();
        expect(psychology.getPersuasiveCTA('hot')).toContain('Amankan sekarang');
        expect(psychology.getPersuasiveCTA('warm')).toContain('promo');
    });

    it('should allow disabling features', () => {
        const psychology = new SalesPsychology({ enableFomo: false });
        expect(psychology.getFomoSignal(mockItems[0])).toBeNull();
    });
});
