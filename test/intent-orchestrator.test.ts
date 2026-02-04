import { describe, it, expect, beforeEach } from 'vitest';
import { IntentOrchestrator } from '../src/lib/intent-orchestrator';

describe('IntentOrchestrator Sub-Engine', () => {
    let orchestrator: IntentOrchestrator;

    beforeEach(() => {
        orchestrator = new IntentOrchestrator({
            nlp: {
                trainingData: {
                    'custom_intent': ['pencarian khusus', 'mode spesial'],
                    'other_intent': ['produk baru', 'barang koleksi'] // Add another label to avoid 100% confidence bias
                }
            },
            salesTriggers: {
                'promo': ['diskon', 'sale']
            }
        });
    });

    it('should detect high-confidence NLP intent', () => {
        orchestrator.train('pencarian khusus', 'custom_intent');
        orchestrator.train('barang koleksi', 'other_intent');

        const intent = orchestrator.detect('pencarian khusus', ['pencarian', 'khusus'], ['cari', 'khusus']);
        expect(intent).toBe('custom_intent');
    });

    it('should fallback to rule-based triggers when NLP is low confidence or no match', () => {
        // "ada diskon" is not in NLP training data, so NLP confidence should be low
        const intent = orchestrator.detect('ada diskon?', ['diskon'], ['diskon']);
        expect(intent).toBe('sales_promo');
    });

    it('should detect contact intent from triggers', () => {
        const intent = orchestrator.detect('hubungi admin', ['hubungi', 'admin'], ['hubung', 'admin']);
        expect(intent).toBe('chat_contact');
    });

    it('should return fuzzy as ultimate fallback', () => {
        const intent = orchestrator.detect('random text here', ['random'], ['random']);
        expect(intent).toBe('fuzzy');
    });
});
