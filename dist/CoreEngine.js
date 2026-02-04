"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreEngine = void 0;
const fuse_1 = __importDefault(require("./lib/fuse"));
// Simple default tokenizer if none provided
const defaultTokenizer = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1);
class CoreEngine {
    constructor(data, FuseClass = fuse_1.default, config = {}) {
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
    initializeFuse() {
        if (this.Fuse) {
            this.fuseInstance = new this.Fuse(this.data, {
                keys: [
                    { name: "title", weight: this.config.weights?.title },
                    { name: "keywords", weight: this.config.weights?.keywords },
                    { name: "description", weight: this.config.weights?.description },
                ],
                threshold: 0.6,
                includeScore: true,
                useExtendedSearch: true,
                findAllMatches: true
            });
        }
    }
    // --- Core Logic ---
    async search(query) {
        // Handle Remote Mode
        if (this.config.searchMode === 'remote' && this.config.apiUrl) {
            try {
                const response = await fetch(`${this.config.apiUrl}?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                // Merge context into results if server doesn't provide it
                return {
                    results: data.results || [],
                    intent: data.intent || 'general',
                    confidence: data.confidence || 0,
                    context: { ...this.context, ...data.context },
                    stats: data.stats || { totalQueries: this.context.history.length, intentCounts: this.getIntentCounts() }
                };
            }
            catch (error) {
                console.error("Remote search failed, falling back to local:", error);
            }
        }
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
    preprocess(query) {
        const tokens = defaultTokenizer(query);
        // Autocorrect (Placeholder for now, can be injected via config later if needed)
        // Synonym expansion
        const expandedTokens = [...tokens];
        tokens.forEach(t => {
            // Handle both array and simple string synonyms
            const syn = this.config.synonyms?.[t];
            if (syn) {
                if (Array.isArray(syn))
                    expandedTokens.push(...syn);
                else
                    expandedTokens.push(syn);
            }
        });
        // Stemming (Suffix Removal)
        if (this.config.stemmingSuffixes && this.config.stemmingSuffixes.length > 0) {
            tokens.forEach((t, index) => {
                let currentToken = t;
                // Simple iterative stripping
                // We keep stripping found suffixes until no more match or word becomes too short
                let stripped = true;
                while (stripped && currentToken.length > 3) {
                    stripped = false;
                    for (const suffix of this.config.stemmingSuffixes) {
                        if (currentToken.endsWith(suffix) && currentToken.length > suffix.length) {
                            const root = currentToken.slice(0, -suffix.length);
                            // Only strip if remaining root is reasonably long (e.g. > 2 chars)
                            if (root.length >= 3) {
                                currentToken = root;
                                expandedTokens.push(currentToken); // Add stemmed version to expansion
                                stripped = true; // Continue trying to strip (e.g. "kan-nya" -> "kan" -> "")
                                break; // Restart suffix loop for new token state
                            }
                        }
                    }
                }
            });
        }
        // Filter stop words
        const filtered = expandedTokens.filter(t => !this.config.stopWords?.includes(t));
        return {
            original: query,
            tokens: tokens, // Original tokens
            expandedTokens: filtered,
            expandedQuery: filtered.join(' ')
        };
    }
    getProliminaryCandidates(expandedQuery) {
        if (!this.fuseInstance)
            return this.data.map(d => ({ item: d, fuseScore: 1 })); // Fallback if no Fuse
        const results = this.fuseInstance.search(expandedQuery);
        return results.map((r) => ({ item: r.item, fuseScore: r.score }));
    }
    detectIntent(tokens) {
        // Generic intent detection based on config patterns
        if (!this.config.intents)
            return 'general';
        for (const intentDef of this.config.intents) {
            for (const pattern of intentDef.patterns) {
                // Multi-word pattern support
                if (pattern.includes(' ')) {
                    if (tokens.join(' ').includes(pattern))
                        return intentDef.name;
                }
                else {
                    if (tokens.includes(pattern))
                        return intentDef.name;
                }
            }
        }
        return 'general';
    }
    calculateAIScore(item, processed, intent) {
        let score = 0;
        // A. Basic Token Match (Manual boost significantly helps precision)
        processed.tokens.forEach((t) => {
            if (item.title.toLowerCase().includes(t))
                score += 10;
            if (item.keywords?.includes(t))
                score += 5;
        });
        // B. Context Boosting
        if (this.context.lastTopic === item.category)
            score += 5;
        if (this.context.lastItemContext === item.title)
            score += 20; // Follow-up boost
        // C. Configurable Boosting Rules
        if (this.config.boostingRules) {
            this.config.boostingRules.forEach(rule => {
                try {
                    if (rule.condition(item, this.context, intent)) {
                        score += rule.score;
                    }
                }
                catch (e) {
                    // Safe execution
                }
            });
        }
        return score;
    }
    updateContext(query, intent, topResults) {
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
    getIntentCounts() {
        const counts = {};
        this.context.history.forEach(h => {
            if (h.intent)
                counts[h.intent] = (counts[h.intent] || 0) + 1;
        });
        return counts;
    }
    // Public API to manually set preferences (e.g. from UI buttons)
    setPreference(key, value) {
        this.context.userPreferences[key] = value;
    }
}
exports.CoreEngine = CoreEngine;
