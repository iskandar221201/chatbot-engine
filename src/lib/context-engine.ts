/**
 * Context Engine Sub-Engine
 * Manages conversation state, history, and anaphora resolution.
 */

import type { AssistantDataItem, AssistantResult } from '../types';
import { DEFAULT_REFERENCE_TRIGGERS } from '../defaults';

export interface ContextState {
    lastCategory: string | null;
    lastItemId: string | null;
    detectedEntities: Set<string>;
    interactionCount: number;
    lockedEntityId: string | null;
}

export class ContextEngine {
    private state: ContextState;
    private referenceTriggers: string[];

    constructor(referenceTriggers: string[] = DEFAULT_REFERENCE_TRIGGERS) {
        this.state = {
            lastCategory: null,
            lastItemId: null,
            detectedEntities: new Set(),
            interactionCount: 0,
            lockedEntityId: null
        };
        this.referenceTriggers = referenceTriggers;
    }

    /**
     * Resolve anaphora (references to previous subjects) in a query
     */
    public resolveAnaphora(query: string): string {
        if (!query || query.length >= 25) return query; // Long queries are usually self-contained

        const queryLower = query.toLowerCase();

        // Check triggers
        const isFollowUp = this.referenceTriggers.some(t => queryLower.includes(t.toLowerCase()));

        if (isFollowUp && (this.state.lockedEntityId || this.state.lastItemId)) {
            const subject = this.state.lockedEntityId || this.state.lastItemId;
            return `${query} ${subject}`;
        }

        return query;
    }

    /**
     * Update state based on the latest result
     */
    public update(result: AssistantResult) {
        this.state.interactionCount++;

        if (result.results && result.results.length > 0) {
            const topItem = result.results[0];
            this.state.lastCategory = topItem.category;
            this.state.lastItemId = topItem.title;

            // Simple Entity Locking: lock if high confidence
            if (result.confidence > 80) {
                this.state.lockedEntityId = topItem.title;
            } else if (result.confidence < 30) {
                this.state.lockedEntityId = null; // Break lock on poor match
            }
        }

        // Track entities
        if (result.entities) {
            Object.keys(result.entities).forEach(e => {
                if (result.entities[e]) this.state.detectedEntities.add(e);
            });
        }
    }

    /**
     * Get the current state summary
     */
    public getState(): Readonly<ContextState> {
        return { ...this.state };
    }

    /**
     * Clear context
     */
    public reset() {
        this.state = {
            lastCategory: null,
            lastItemId: null,
            detectedEntities: new Set(),
            interactionCount: 0,
            lockedEntityId: null
        };
    }
}

export default ContextEngine;
