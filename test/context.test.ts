import { describe, it, expect, beforeEach } from 'vitest';
import { ContextEngine } from '../src/lib/context-engine';
import { AssistantResult } from '../src/types';

describe('ContextEngine Sub-Engine', () => {
    let ce: ContextEngine;

    beforeEach(() => {
        ce = new ContextEngine(['berapa', 'stok', 'harga']);
    });

    it('should resolve anaphora using history', () => {
        // Mock a previous interaction that set an item
        ce.update({
            results: [{ title: 'iPhone 15', category: 'Gadget', url: '/iph15' } as any],
            confidence: 90
        } as AssistantResult);

        const resolved = ce.resolveAnaphora('berapa harganya?');
        expect(resolved).toBe('berapa harganya? iPhone 15');
    });

    it('should lock items on high confidence matches', () => {
        ce.update({
            results: [{ title: 'MacBook M3', category: 'Laptop', url: '/mac3' } as any],
            confidence: 95
        } as AssistantResult);

        expect(ce.getState().lockedEntityId).toBe('MacBook M3');
    });

    it('should break lock on low confidence results', () => {
        ce.update({
            results: [{ title: 'MacBook M3', category: 'Laptop', url: '/mac3' } as any],
            confidence: 95
        } as AssistantResult);

        // Subsequent low confidence search
        ce.update({
            results: [{ title: 'Something else', category: 'Page', url: '/x' } as any],
            confidence: 15
        } as AssistantResult);

        expect(ce.getState().lockedEntityId).toBeNull();
    });

    it('should reset properly', () => {
        ce.update({
            results: [{ title: 'iPhone 15', category: 'Gadget', url: '/iph15' } as any],
            confidence: 90
        } as AssistantResult);

        ce.reset();
        expect(ce.getState().lastItemId).toBeNull();
        expect(ce.getState().interactionCount).toBe(0);
    });
});
