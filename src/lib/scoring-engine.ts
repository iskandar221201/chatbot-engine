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
     * Enhanced with better relevance differentiation
     */
    public calculate(
        item: AssistantDataItem,
        processed: any,
        fuseScore: number,
        intent: string,
        contextState: any
    ): { score: number, breakdown: Record<string, number> } {
        const breakdown: Record<string, number> = {
            fuzzyMatch: Math.round((1 - fuseScore) * 10),
            tokenMatch: 0,
            queryCoverage: 0,     // NEW: How much of the query is covered
            specificityBonus: 0,  // NEW: Bonus for highly specific matches
            phraseMatch: 0,       // NEW: Exact phrase matching bonus
            fieldBoost: 0,
            contextBoost: 0,
            psychologyBoost: 0,
            intentBoost: 0,
            penalty: 0
        };

        let score = breakdown.fuzzyMatch;
        const titleLower = item.title.toLowerCase();
        const keywordsStr = (item.keywords || []).join(' ').toLowerCase();
        const descLower = (item.description || '').toLowerCase();
        const contentLower = (item.content || '').toLowerCase();

        // Weighted content (title > keywords > description > content)
        const fullContent = (titleLower + ' ' + keywordsStr + ' ' + descLower + ' ' + contentLower);

        const queryTokens = processed.tokens as string[];
        const totalQueryTokens = queryTokens.length;
        let matchedTokens = 0;

        // 1. Token Matching with Position Weighting
        // Earlier tokens in query are more important
        queryTokens.forEach((token: string, i: number) => {
            const positionWeight = 1 + (totalQueryTokens - i) / totalQueryTokens; // 2.0 to 1.0

            if (fullContent.includes(token)) {
                matchedTokens++;
                let tokenScore = 10 * positionWeight;

                // Bonus for title match (strongest signal)
                if (titleLower.includes(token)) {
                    tokenScore += 15 * positionWeight;
                }
                // Bonus for keyword match (explicit tagging)
                if (keywordsStr.includes(token)) {
                    tokenScore += 10 * positionWeight;
                }

                // N-gram bonus (consecutive tokens)
                if (i > 0 && fullContent.includes(queryTokens[i - 1] + ' ' + token)) {
                    tokenScore += 12 * positionWeight;
                }

                breakdown.tokenMatch += Math.round(tokenScore);
            }

            // Fuzzy match on title
            const dice = this.calculateDiceCoefficient(token, titleLower);
            if (dice > 0.4) {
                breakdown.tokenMatch += Math.round(dice * 12 * positionWeight);
            }
        });

        // 2. Query Coverage (what % of query tokens are matched)
        if (totalQueryTokens > 0) {
            const coverage = matchedTokens / totalQueryTokens;
            breakdown.queryCoverage = Math.round(coverage * 40); // 0-40 points

            // Penalty for low coverage (less than 50% matched)
            if (coverage < 0.5 && totalQueryTokens > 1) {
                breakdown.penalty -= Math.round((0.5 - coverage) * 30);
            }
        }

        // 3. Specificity Bonus
        // If item's title/keywords closely match the query (high relevance)
        const titleTokens = titleLower.split(/\s+/).filter(t => t.length > 2);
        const keywordTokens = keywordsStr.split(/\s+/).filter(t => t.length > 2);
        const itemTokens = [...new Set([...titleTokens, ...keywordTokens])];

        if (itemTokens.length > 0) {
            // How many of item's defining tokens are in query?
            const itemMatchCount = itemTokens.filter(t =>
                queryTokens.some(qt => qt.includes(t) || t.includes(qt))
            ).length;
            const specificity = itemMatchCount / Math.min(itemTokens.length, 5); // Cap at 5 to avoid bias
            breakdown.specificityBonus = Math.round(specificity * 25);
        }

        // 4. Exact Phrase Match (strongest signal)
        const queryPhrase = queryTokens.join(' ').toLowerCase();
        if (queryPhrase.length > 3) {
            if (titleLower.includes(queryPhrase)) {
                breakdown.phraseMatch += 35;
            } else if (keywordsStr.includes(queryPhrase)) {
                breakdown.phraseMatch += 25;
            } else if (descLower.includes(queryPhrase)) {
                breakdown.phraseMatch += 15;
            }

            // Partial phrase match (at least 2 consecutive tokens)
            for (let i = 0; i < queryTokens.length - 1; i++) {
                const bigramPhrase = queryTokens[i] + ' ' + queryTokens[i + 1];
                if (titleLower.includes(bigramPhrase)) {
                    breakdown.phraseMatch += 10;
                }
            }
        }

        // 5. Field Weighting (legacy, but reduced since we handle it above)
        queryTokens.forEach((token: string) => {
            if (item.category.toLowerCase().includes(token)) breakdown.fieldBoost += 15;
        });

        // 6. Contextual Boosting
        if (contextState.lastCategory === item.category) breakdown.contextBoost += 8;
        if (contextState.lastItemId === item.title || contextState.lockedEntityId === item.title) {
            breakdown.contextBoost += 25;
        }

        // 7. Psychology & Recommendation Boosting
        if (item.is_recommended) breakdown.psychologyBoost += 25;

        // 8. Intent-Based Boosting
        if (processed.signals?.isUrgent) {
            breakdown.intentBoost += 8;
            if (item.category.toLowerCase().match(/stok|ready|cabang/)) {
                breakdown.intentBoost += 20;
            }
        }

        if (intent.startsWith('sales_')) {
            if (item.price_numeric || item.sale_price) breakdown.intentBoost += 20;
            if (item.category.toLowerCase().match(/produk|layanan/)) breakdown.intentBoost += 15;
        }

        // 9. Penalty for low-value content (Crawler Pages)
        if (item.category === (this.config.crawlerCategory || 'Page')) {
            breakdown.penalty -= 25;
        }

        // Final aggregate score
        score += breakdown.tokenMatch + breakdown.queryCoverage + breakdown.specificityBonus +
            breakdown.phraseMatch + breakdown.fieldBoost + breakdown.contextBoost +
            breakdown.psychologyBoost + breakdown.intentBoost + breakdown.penalty;

        return { score, breakdown };
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
