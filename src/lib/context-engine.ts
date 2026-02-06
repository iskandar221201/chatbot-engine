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

export interface ContextConfig {
    referenceTriggers?: string[];
    ttl?: number; // Time to live in ms (default 5 mins)
    maxInteractions?: number; // Max interactions before reset (default 20)
}

export interface ContextState {
    lastCategory: string | null;
    lastItemId: string | null;
    detectedEntities: Set<string>;
    interactionCount: number;
    lockedEntityId: string | null;
    lastActive: number; // Timestamp
}

export class ContextEngine {
    private state: ContextState = {
        lastCategory: null,
        lastItemId: null,
        detectedEntities: new Set(),
        interactionCount: 0,
        lockedEntityId: null,
        lastActive: 0
    };
    private config: ContextConfig;

    constructor(config: ContextConfig | string[] = {}) {
        // Support legacy array argument for backward compatibility
        const baseConfig = Array.isArray(config) ? { referenceTriggers: config } : config;

        this.config = {
            referenceTriggers: DEFAULT_REFERENCE_TRIGGERS,
            ttl: 5 * 60 * 1000, // 5 mins
            maxInteractions: 20,
            ...baseConfig
        };

        this.reset();
    }

    /**
     * Resolve anaphora (references to previous subjects) in a query
     */
    public resolveAnaphora(query: string): string {
        this.prune(); // Check for stale context

        if (!query || query.length >= 25) return query; // Long queries are usually self-contained

        const queryLower = query.toLowerCase();
        const triggers = this.config.referenceTriggers || DEFAULT_REFERENCE_TRIGGERS;

        // Check triggers
        const isFollowUp = triggers.some(t => queryLower.includes(t.toLowerCase()));

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
        this.state.lastActive = Date.now();

        if (this.state.interactionCount > (this.config.maxInteractions || 20)) {
            this.reset(); // Auto-reset on too many interactions to prevent hallucination
            return;
        }

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
     * Prune stale state based on TTL
     */
    private prune() {
        if (Date.now() - this.state.lastActive > (this.config.ttl || 300000)) {
            this.reset();
        }
    }

    /**
     * Get the current state summary
     */
    public getState(): Readonly<ContextState> {
        this.prune();
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
            lockedEntityId: null,
            lastActive: Date.now()
        };
    }
}

export default ContextEngine;
