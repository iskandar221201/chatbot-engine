/**
 * Scoring Engine Sub-Engine
 * Handles ranking, relevancy calculations, and weight-based scoring.
 */

import { AssistantDataItem, AssistantResult } from "../types";

export interface ScoringConfig {
    crawlerCategory?: string;
}

export class ScoringEngine {
    private config: ScoringConfig;

    constructor(config: ScoringConfig = {}) {
        this.config = config;
    }

    /**
     * Main scoring function for a single item
     */
    public calculate(
        item: AssistantDataItem,
        processed: any,
        fuseScore: number,
        intent: string,
        contextState: any
    ): number {
        let score = (1 - fuseScore) * 10;
        const titleLower = item.title.toLowerCase();
        const fullContent = (item.title + ' ' + (item.keywords || []).join(' ') + ' ' + item.description + ' ' + (item.content || '')).toLowerCase();

        // 1. Token & N-gram Matching
        processed.tokens.forEach((token: string, i: number) => {
            if (fullContent.includes(token)) {
                score += 10;
                if (i > 0 && fullContent.includes(processed.tokens[i - 1] + ' ' + token)) {
                    score += 8;
                }
            }
            const dice = this.calculateDiceCoefficient(token, titleLower);
            if (dice > 0.4) {
                score += (dice * 15);
            }
        });

        // 2. Field Weighting
        processed.tokens.forEach((token: string) => {
            if (titleLower.includes(token)) score += 25;
            if (item.category.toLowerCase().includes(token)) score += 25;
        });

        // 3. Contextual Boosting
        if (contextState.lastCategory === item.category) score += 10;
        if (contextState.lastItemId === item.title || contextState.lockedEntityId === item.title) {
            score += 30;
        }

        // 4. Psychology & Recommendation Boosting
        if (item.is_recommended) score += 30;

        // 5. Intent-Based Boosting
        if (processed.signals?.isUrgent) {
            score += 10;
            if (item.category.toLowerCase().match(/stok|ready|cabang/)) {
                score += 25;
            }
        }

        if (intent.startsWith('sales_')) {
            if (item.price_numeric || item.sale_price) score += 30;
            if (item.category.toLowerCase().match(/produk|layanan/)) score += 20;
        }

        // 6. Penalty for low-value content (Crawler Pages)
        if (item.category === (this.config.crawlerCategory || 'Page')) {
            score -= 30;
        }

        return score;
    }

    /**
     * Calculate similarity between two strings using bigrams
     */
    public calculateDiceCoefficient(s1: string, s2: string): number {
        if (!s1 || !s2) return 0;
        const bigrams = (s: string) => {
            const b = new Set();
            for (let i = 0; i < s.length - 1; i++) {
                b.add(s.substring(i, i + 2));
            }
            return b;
        };
        const b1 = bigrams(s1);
        const b2 = bigrams(s2);
        let intersection = 0;
        b1.forEach(b => { if (b2.has(b)) intersection++; });

        const total = b1.size + b2.size;
        return total === 0 ? 0 : (2 * intersection) / total;
    }

    /**
     * Scoring for product comparisons
     */
    public calculateComparisonScore(item: AssistantDataItem, attributes: Record<string, string>): number {
        let score = 0;
        if (item.is_recommended) score += 50;
        if (item.rating) score += (item.rating * 10);
        if (item.sale_price && item.price_numeric) {
            const discount = (item.price_numeric - item.sale_price) / item.price_numeric;
            score += (discount * 100);
        }
        score += Object.keys(attributes).length * 5;
        return score;
    }
}

export default ScoringEngine;
