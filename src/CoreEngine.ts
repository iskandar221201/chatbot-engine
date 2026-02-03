import { SearchDataItem, SearchResult, AIConfig, SearchContext, IntentDefinition } from './types';

// Simple default tokenizer if none provided
const defaultTokenizer = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1);

export class CoreEngine {
    private data: SearchDataItem[];
    private Fuse: any; // Fuse constructor
    private fuseInstance: any;
    private config: AIConfig;
    private context: SearchContext;

    constructor(data: SearchDataItem[], FuseClass: any, config: AIConfig = {}) {
        this.data = data;
        this.Fuse = FuseClass;
        this.config = {
            synonyms: {},
            stopWords: [],
            intents: [],
            boostingRules: [],
            weights: { title: 0.8, keywords: 0.5, description: 0.2 },
            ...config
        };

        this.context = {
            history: [],
            lastTopic: null,
            lastItemContext: null,
            userPreferences: {}
        };

        this.initializeFuse();
    }

    private initializeFuse() {
        if (this.Fuse) {
            this.fuseInstance = new this.Fuse(this.data, {
                keys: [
                    { name: "title", weight: this.config.weights?.title },
                    { name: "keywords", weight: this.config.weights?.keywords },
                    { name: "description", weight: this.config.weights?.description },
                ],
                threshold: 0.45,
                includeScore: true,
                useExtendedSearch: true,
                findAllMatches: true
            });
        }
    }

    // --- Core Logic ---

    public search(query: string): SearchResult {
        const processed = this.preprocess(query);
        const intent = this.detectIntent(processed.tokens);

        // 1. Fuse.js retrieval
        let candidates = this.getProliminaryCandidates(processed.expandedQuery);

        // 2. AI Scoring & Reranking
        const ranked = candidates.map(c => {
            const aiScore = this.calculateAIScore(c.item, processed, intent);
            const fuseScoreContribution = ((1 - c.fuseScore) * 10); // Transform 0..1 to 0..10
            return {
                item: c.item,
                score: aiScore + fuseScoreContribution
            };
        });

        ranked.sort((a, b) => b.score - a.score);

        // 3. Context Updates
        this.updateContext(query, intent, ranked);

        return {
            results: ranked.map(r => r.item),
            intent,
            confidence: ranked.length > 0 ? ranked[0].score : 0,
            context: { ...this.context }, // Return snapshot
            stats: {
                totalQueries: this.context.history.length,
                intentCounts: this.getIntentCounts()
            }
        };
    }

    // --- Helpers ---

    private preprocess(query: string) {
        const tokens = defaultTokenizer(query);

        // Autocorrect (Placeholder for now, can be injected via config later if needed)
        // Synonym expansion
        const expandedTokens = [...tokens];
        tokens.forEach(t => {
            // Handle both array and simple string synonyms
            const syn = this.config.synonyms?.[t];
            if (syn) {
                if (Array.isArray(syn)) expandedTokens.push(...syn);
                else expandedTokens.push(syn);
            }
        });

        // Filter stop words
        const filtered = expandedTokens.filter(t => !this.config.stopWords?.includes(t));

        return {
            original: query,
            tokens: tokens, // Original tokens
            expandedTokens: filtered,
            expandedQuery: filtered.join(' ')
        };
    }

    private getProliminaryCandidates(expandedQuery: string): { item: SearchDataItem, fuseScore: number }[] {
        if (!this.fuseInstance) return this.data.map(d => ({ item: d, fuseScore: 1 })); // Fallback if no Fuse

        const results = this.fuseInstance.search(expandedQuery);
        return results.map((r: any) => ({ item: r.item, fuseScore: r.score }));
    }

    private detectIntent(tokens: string[]): string {
        // Generic intent detection based on config patterns
        if (!this.config.intents) return 'general';

        for (const intentDef of this.config.intents) {
            for (const pattern of intentDef.patterns) {
                // Multi-word pattern support
                if (pattern.includes(' ')) {
                    if (tokens.join(' ').includes(pattern)) return intentDef.name;
                } else {
                    if (tokens.includes(pattern)) return intentDef.name;
                }
            }
        }
        return 'general';
    }

    private calculateAIScore(item: SearchDataItem, processed: any, intent: string): number {
        let score = 0;

        // A. Basic Token Match (Manual boost significantly helps precision)
        processed.tokens.forEach((t: string) => {
            if (item.title.toLowerCase().includes(t)) score += 10;
            if (item.keywords?.includes(t)) score += 5;
        });

        // B. Context Boosting
        if (this.context.lastTopic === item.category) score += 5;
        if (this.context.lastItemContext === item.title) score += 20; // Follow-up boost

        // C. Configurable Boosting Rules
        if (this.config.boostingRules) {
            this.config.boostingRules.forEach(rule => {
                try {
                    if (rule.condition(item, this.context, intent)) {
                        score += rule.score;
                    }
                } catch (e) {
                    // Safe execution
                }
            });
        }

        return score;
    }

    private updateContext(query: string, intent: string, topResults: any[]) {
        this.context.history.push({
            role: 'user',
            content: query,
            timestamp: Date.now(),
            intent
        });

        if (topResults.length > 0) {
            const bestItem = topResults[0].item;
            this.context.lastTopic = bestItem.category;

            // Heuristic: If detailed intent or specific match, set generic item context
            // In a real library, we might want a "isEntity" flag on data
            this.context.lastItemContext = bestItem.title;
        }
    }

    private getIntentCounts(): Record<string, number> {
        const counts: Record<string, number> = {};
        this.context.history.forEach(h => {
            if (h.intent) counts[h.intent] = (counts[h.intent] || 0) + 1;
        });
        return counts;
    }

    // Public API to manually set preferences (e.g. from UI buttons)
    public setPreference(key: string, value: any) {
        this.context.userPreferences[key] = value;
    }
}
