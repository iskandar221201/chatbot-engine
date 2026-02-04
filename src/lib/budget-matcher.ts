/**
 * Budget Matcher
 * Match user budget to suitable products
 */

import { NumberParser } from './number-parser';
import type { AssistantDataItem } from '../types';

export interface BudgetMatchResult {
    budget: number | null;
    budgetText: string | null;
    matches: BudgetMatchedItem[];
    hasExactMatch: boolean;
    suggestion: string;
}

export interface BudgetMatchedItem {
    item: AssistantDataItem;
    price: number;
    priceDiff: number;
    matchType: 'exact' | 'under' | 'over' | 'close';
    percentDiff: number;
}

export interface BudgetMatcherConfig {
    tolerance?: number;        // Percentage above budget still acceptable (default 10%)
    showOverBudget?: boolean;  // Include items over budget
    maxOverBudget?: number;    // Max percentage over budget to show
    preferSalePrice?: boolean; // Use sale_price if available
    prioritizeRecommended?: boolean;
}

// Budget keywords for extraction
const BUDGET_PATTERNS = [
    /budget\s*(?:saya\s*)?(?:sekitar\s*)?(.+?)(?:\s*untuk|\s*buat|\s*$)/i,
    /(?:punya|ada)\s*(?:dana|uang|budget)\s*(?:sekitar\s*)?(.+?)(?:\s*untuk|\s*buat|\s*$)/i,
    /(?:maksimal|maks|max)\s*(.+?)(?:\s*untuk|\s*buat|\s*$)/i,
    /(?:kisaran|range)\s*(.+?)(?:\s*sampai|s\.?d\.?|-)\s*(.+?)(?:\s*$)/i,
    /(?:sekitar|kira-kira|kurang lebih)\s*(.+?)(?:\s*$)/i,
    /(?:di\s*bawah|under)\s*(.+?)(?:\s*$)/i,
    /(\d[\d.,]*\s*(?:jt|juta|rb|ribu|k|m))\s*(?:aja|saja|doang)?(?:\s*$)/i
];

export class BudgetMatcher {
    private config: Required<BudgetMatcherConfig>;

    constructor(config: BudgetMatcherConfig = {}) {
        this.config = {
            tolerance: config.tolerance ?? 10,
            showOverBudget: config.showOverBudget ?? true,
            maxOverBudget: config.maxOverBudget ?? 30,
            preferSalePrice: config.preferSalePrice ?? true,
            prioritizeRecommended: config.prioritizeRecommended ?? true
        };
    }

    /**
     * Extract budget from a query string
     */
    extractBudget(query: string): { min: number | null; max: number | null; text: string | null } {
        for (const pattern of BUDGET_PATTERNS) {
            const match = query.match(pattern);
            if (match) {
                // Range pattern (kisaran X sampai Y)
                if (match[2]) {
                    const min = NumberParser.parse(match[1]);
                    const max = NumberParser.parse(match[2]);
                    return {
                        min,
                        max,
                        text: match[0]
                    };
                }

                // Single value pattern
                const value = NumberParser.parse(match[1]);
                if (value) {
                    return {
                        min: null,
                        max: value,
                        text: match[0]
                    };
                }
            }
        }

        // Fallback: try to find any number in the query
        const fallbackValue = NumberParser.parse(query);
        if (fallbackValue && fallbackValue >= 10000) { // Minimum reasonable budget
            return {
                min: null,
                max: fallbackValue,
                text: null
            };
        }

        return { min: null, max: null, text: null };
    }

    /**
     * Find products matching the budget
     */
    match(query: string, products: AssistantDataItem[]): BudgetMatchResult {
        const budgetInfo = this.extractBudget(query);

        if (!budgetInfo.max && !budgetInfo.min) {
            return {
                budget: null,
                budgetText: null,
                matches: [],
                hasExactMatch: false,
                suggestion: 'Maaf, saya tidak menemukan budget di pertanyaan Anda. Bisa disebutkan budget-nya?'
            };
        }

        const maxBudget = budgetInfo.max || budgetInfo.min!;
        const minBudget = budgetInfo.min || 0;
        const tolerance = maxBudget * (this.config.tolerance / 100);
        const maxOverBudgetLimit = maxBudget * (1 + this.config.maxOverBudget / 100);

        const matches: BudgetMatchedItem[] = [];

        for (const item of products) {
            // Get price (prefer sale_price if configured)
            let price = this.config.preferSalePrice && item.sale_price
                ? item.sale_price
                : item.price_numeric;

            if (!price) continue;

            const priceDiff = price - maxBudget;
            const percentDiff = Math.round((priceDiff / maxBudget) * 100);

            // Determine match type
            let matchType: 'exact' | 'under' | 'over' | 'close';
            if (price >= minBudget && price <= maxBudget) {
                matchType = 'exact';
            } else if (price < minBudget) {
                matchType = 'under';
            } else if (price <= maxBudget + tolerance) {
                matchType = 'close';
            } else {
                matchType = 'over';
            }

            // Filter based on config
            if (matchType === 'over') {
                if (!this.config.showOverBudget) continue;
                if (price > maxOverBudgetLimit) continue;
            }

            matches.push({
                item,
                price,
                priceDiff,
                matchType,
                percentDiff
            });
        }

        // Sort: exact/under first, then by price closest to budget
        matches.sort((a, b) => {
            // Prioritize recommended if configured
            if (this.config.prioritizeRecommended) {
                if (a.item.is_recommended && !b.item.is_recommended) return -1;
                if (!a.item.is_recommended && b.item.is_recommended) return 1;
            }

            // Then by match type
            const typeOrder = { exact: 0, under: 1, close: 2, over: 3 };
            const typeDiff = typeOrder[a.matchType] - typeOrder[b.matchType];
            if (typeDiff !== 0) return typeDiff;

            // Then by how close to budget
            return Math.abs(a.priceDiff) - Math.abs(b.priceDiff);
        });

        const hasExactMatch = matches.some(m => m.matchType === 'exact' || m.matchType === 'close');
        const suggestion = this.generateSuggestion(matches, maxBudget, hasExactMatch);

        return {
            budget: maxBudget,
            budgetText: budgetInfo.text,
            matches,
            hasExactMatch,
            suggestion
        };
    }

    /**
     * Quick check if query contains budget
     */
    static hasBudget(query: string): boolean {
        const matcher = new BudgetMatcher();
        const result = matcher.extractBudget(query);
        return result.max !== null || result.min !== null;
    }

    /**
     * Get products within a price range
     */
    getInRange(products: AssistantDataItem[], min: number, max: number): AssistantDataItem[] {
        return products.filter(p => {
            const price = p.sale_price || p.price_numeric;
            return price && price >= min && price <= max;
        });
    }

    /**
     * Get cheapest and most expensive
     */
    getPriceRange(products: AssistantDataItem[]): { min: AssistantDataItem | null; max: AssistantDataItem | null } {
        const withPrices = products.filter(p => p.price_numeric || p.sale_price);
        if (withPrices.length === 0) return { min: null, max: null };

        const sorted = withPrices.sort((a, b) => {
            const priceA = a.sale_price || a.price_numeric || 0;
            const priceB = b.sale_price || b.price_numeric || 0;
            return priceA - priceB;
        });

        return {
            min: sorted[0],
            max: sorted[sorted.length - 1]
        };
    }

    private generateSuggestion(matches: BudgetMatchedItem[], budget: number, hasExactMatch: boolean): string {
        const formatted = NumberParser.formatCurrency(budget);

        if (matches.length === 0) {
            return `Maaf, tidak ada produk yang sesuai dengan budget ${formatted}. Mau coba dengan budget berbeda?`;
        }

        if (hasExactMatch) {
            const exactCount = matches.filter(m => m.matchType === 'exact' || m.matchType === 'close').length;
            return `Ada ${exactCount} produk yang cocok dengan budget ${formatted}!`;
        }

        const closest = matches[0];
        if (closest.matchType === 'under') {
            return `Ada ${matches.length} produk di bawah budget ${formatted}. Yang terdekat: ${closest.item.title}`;
        }

        const overPercent = closest.percentDiff;
        return `Produk terdekat ${overPercent}% di atas budget. Mau saya tunjukkan opsi lain?`;
    }
}

export default BudgetMatcher;
