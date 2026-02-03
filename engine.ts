import type { AssistantDataItem, AssistantResult, AssistantConfig } from "./types";

export class AssistantEngine {
    private searchData: AssistantDataItem[];
    private Fuse: any;
    private fuse: any;
    private config: AssistantConfig;

    private history: {
        lastCategory: string | null;
        detectedEntities: Set<string>;
    };

    constructor(searchData: AssistantDataItem[], Fuse: any, config: AssistantConfig) {
        this.searchData = searchData;
        this.Fuse = Fuse;
        this.config = {
            phoneticMap: {},
            semanticMap: {},
            stopWords: [],
            entityDefinitions: {},
            intentRules: [],
            ...config
        };

        this.history = {
            lastCategory: null,
            detectedEntities: new Set(),
        };

        this.initFuse();
    }

    private initFuse() {
        if (this.Fuse) {
            this.fuse = new this.Fuse(this.searchData, {
                keys: [
                    { name: "title", weight: 0.8 },
                    { name: "keywords", weight: 0.5 },
                    { name: "description", weight: 0.2 },
                ],
                threshold: 0.45,
                includeScore: true,
                useExtendedSearch: true,
            });
        }
    }

    private autoCorrect(word: string): string {
        if (!this.config.phoneticMap) return word;
        for (const [correct, typos] of Object.entries(this.config.phoneticMap)) {
            if (typos.includes(word)) return correct;
        }
        return word;
    }

    private preprocess(query: string) {
        const stopWords = new Set(this.config.stopWords || []);
        const rawWords = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1);

        // Step 1: Phonetic Auto-correct
        let correctedWords = rawWords.map(w => this.autoCorrect(w));

        // Step 2: Basic Stemming (Suffix Removal) - Configurable
        correctedWords = correctedWords.map(w => {
            const suffixes = this.config.stemmingSuffixes || [];
            for (const suffix of suffixes) {
                if (w.endsWith(suffix) && w.length > suffix.length + 3) {
                    return w.slice(0, -suffix.length);
                }
            }
            return w;
        });

        const filteredWords = correctedWords.filter(w => !stopWords.has(w));

        const expansion: string[] = [];
        filteredWords.forEach(w => {
            if (this.config.semanticMap && this.config.semanticMap[w]) {
                expansion.push(...this.config.semanticMap[w]);
            }
        });

        return {
            tokens: filteredWords,
            expanded: [...new Set([...filteredWords, ...expansion])],
            entities: this.extractEntities(filteredWords)
        };
    }

    private extractEntities(tokens: string[]) {
        const detected: Record<string, boolean> = {};
        if (this.config.entityDefinitions) {
            for (const [entityName, keywords] of Object.entries(this.config.entityDefinitions)) {
                const isPresent = tokens.some(t => keywords.includes(t));
                detected[entityName] = isPresent;
                if (isPresent) this.history.detectedEntities.add(entityName);
            }
        }
        return detected;
    }

    public search(query: string): AssistantResult {
        const processed = this.preprocess(query);
        let candidates: any[] = [];

        if (this.fuse) {
            // Use OR operator for semantic expansions
            const fuseResults = this.fuse.search(processed.expanded.join(' | '));
            candidates = fuseResults.map((f: any) => ({
                item: f.item,
                fuseScore: f.score
            }));
        }

        const finalResults = candidates.map(c => {
            const score = this.calculateScore(c.item, processed, c.fuseScore);
            return { item: c.item, score };
        });

        finalResults.sort((a, b) => b.score - a.score);

        if (finalResults.length > 0) {
            this.history.lastCategory = finalResults[0].item.category;
        }

        const topMatches = finalResults
            .filter(r => r.score > 10)
            .map(r => r.item)
            .slice(0, 5);

        return {
            results: topMatches,
            intent: this.detectIntent(processed),
            entities: processed.entities,
            confidence: finalResults.length > 0 ? Math.min(Math.round(finalResults[0].score * 2), 100) : 0
        };
    }

    private calculateScore(item: AssistantDataItem, processed: any, fuseScore: number): number {
        let score = (1 - fuseScore) * 10;
        const text = (item.title + ' ' + (item.keywords || []).join(' ') + ' ' + item.description).toLowerCase();

        // Sequential matching
        processed.tokens.forEach((token: string, i: number) => {
            if (text.includes(token)) {
                score += 10;
                if (i > 0 && text.includes(processed.tokens[i - 1] + ' ' + token)) score += 5;
            }
        });

        // Exact hits on title/category
        processed.tokens.forEach((token: string) => {
            if (item.title.toLowerCase().includes(token)) score += 20;
            if (item.category.toLowerCase().includes(token)) score += 25;
            if (item.keywords?.some((k: string) => k.toLowerCase() === token)) score += 15;
        });

        // History bias
        if (this.history.lastCategory === item.category) score += 10;

        // Intent-based massive boost
        const intent = this.detectIntent(processed);
        if (intent !== 'fuzzy') {
            // If item category matches intent name (or is specifically mapped)
            if (item.category.toLowerCase().includes(intent.replace('paket_', '').replace('layanan_', ''))) {
                score += 50;
            }
        }

        // SALES-DRIVEN LOGIC: Boost recommended items
        if (item.is_recommended) {
            score += 25; // Significant boost to push promoted items to the top
        }

        return score;
    }

    private detectIntent(processed: any): string {
        if (!this.config.intentRules) return 'fuzzy';

        for (const rule of this.config.intentRules) {
            const entityMatch = !rule.conditions.entities || rule.conditions.entities.some(e => processed.entities[e]);
            const tokenMatch = !rule.conditions.tokens || rule.conditions.tokens.some(t => processed.tokens.includes(t));

            if (entityMatch && tokenMatch) return rule.intent;
        }

        return 'fuzzy';
    }
}
