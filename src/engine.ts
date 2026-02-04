import type { AssistantDataItem, AssistantResult, AssistantConfig } from "./types";
import Fuse from "./lib/fuse";

export class AssistantEngine {
    private searchData: AssistantDataItem[];
    private Fuse: any;
    private fuse: any;
    private config: AssistantConfig;

    private history: {
        lastCategory: string | null;
        detectedEntities: Set<string>;
    };

    constructor(searchData: AssistantDataItem[], FuseClass: any = Fuse, config: AssistantConfig = {}) {
        this.searchData = searchData;
        this.Fuse = FuseClass;
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
        const signals = {
            isQuestion: query.includes('?'),
            isUrgent: query.includes('!'),
        };

        const stopWords = new Set(this.config.stopWords || []);
        // Step 0: Initial cleaning
        const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
        const rawWords = cleanQuery.split(/\s+/).filter(w => w.length > 1);

        // Step 1: Phonetic Auto-correct
        let correctedWords = rawWords.map(w => this.autoCorrect(w));

        // Step 2: Advanced Indonesian Stemming
        const stemmedWords = correctedWords.map(w => this.stemIndonesian(w));

        // Keep both original and stemmed for better coverage
        const allTokens = [...new Set([...correctedWords, ...stemmedWords])];
        const filteredWords = allTokens.filter(w => !stopWords.has(w));

        const expansion: string[] = [];
        filteredWords.forEach(w => {
            if (this.config.semanticMap && this.config.semanticMap[w]) {
                expansion.push(...this.config.semanticMap[w]);
            }
            // Also check expansion for stemmed version if different
            const stem = this.stemIndonesian(w);
            if (stem !== w && this.config.semanticMap && this.config.semanticMap[stem]) {
                expansion.push(...this.config.semanticMap[stem]);
            }
        });

        return {
            tokens: filteredWords,
            expanded: [...new Set([...filteredWords, ...expansion])],
            entities: this.extractEntities(filteredWords),
            signals
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

    public async search(query: string): Promise<AssistantResult> {
        // Handle Remote Mode (Supports single or multiple APIs)
        if (this.config.searchMode === 'remote' && this.config.apiUrl) {
            try {
                const urls = Array.isArray(this.config.apiUrl) ? this.config.apiUrl : [this.config.apiUrl];
                const results = await Promise.all(urls.map(async (url) => {
                    try {
                        const response = await fetch(`${url}?q=${encodeURIComponent(query)}`, {
                            headers: this.config.apiHeaders || {}
                        });
                        return await response.json();
                    } catch (e) {
                        console.error(`Remote fetch failed for ${url}:`, e);
                        return { results: [], intent: 'fuzzy', entities: {} };
                    }
                }));

                // Merge all results
                const mergedResults = results.reduce((acc, curr) => {
                    acc.results.push(...(curr.results || []));
                    if (curr.intent && curr.intent !== 'fuzzy') acc.intent = curr.intent;
                    acc.entities = { ...acc.entities, ...(curr.entities || {}) };
                    return acc;
                }, { results: [], intent: 'fuzzy', entities: {}, confidence: 0 } as AssistantResult);

                if (mergedResults.results.length > 0) {
                    // Re-calculate scores for remote results to apply local sales-driven boosts
                    const processed = this.preprocess(query);
                    const ranked = mergedResults.results.map((item: AssistantDataItem) => ({
                        item,
                        score: this.calculateScore(item, processed, 0.5) // 0.5 as neutral fuse score for remote
                    })).sort((a: any, b: any) => b.score - a.score);

                    return {
                        ...mergedResults,
                        results: ranked.map((r: any) => r.item).slice(0, 5),
                        confidence: Math.min(Math.round(ranked[0].score * 2), 100)
                    };
                }
            } catch (error) {
                console.error("Remote search orchestration failed, falling back to local:", error);
            }
        }

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

    private calculateDiceCoefficient(s1: string, s2: string): number {
        const getBigrams = (str: string) => {
            const bigrams = new Set<string>();
            for (let i = 0; i < str.length - 1; i++) {
                bigrams.add(str.substring(i, i + 2));
            }
            return bigrams;
        };

        if (s1 === s2) return 1;
        if (s1.length < 2 || s2.length < 2) return 0;

        const bigrams1 = getBigrams(s1);
        const bigrams2 = getBigrams(s2);

        let intersection = 0;
        for (const bigram of bigrams1) {
            if (bigrams2.has(bigram)) intersection++;
        }

        return (2 * intersection) / (bigrams1.size + bigrams2.size);
    }

    private stemIndonesian(word: string): string {
        let stemmed = word.toLowerCase();

        // 1. Remove inflectional suffixes (-lah, -kah, -ku, -mu, -nya)
        const particleSuffixes = ['lah', 'kah', 'pun', 'ku', 'mu', 'nya'];
        for (const s of particleSuffixes) {
            if (stemmed.endsWith(s) && stemmed.length > s.length + 3) {
                stemmed = stemmed.slice(0, -s.length);
                break;
            }
        }

        // 2. Remove derivational suffixes (-kan, -an, -i)
        const derivationSuffixes = ['kan', 'an', 'i'];
        for (const s of derivationSuffixes) {
            if (stemmed.endsWith(s) && stemmed.length > s.length + 3) {
                // Special case for 'i' to avoid overstemming
                if (s === 'i' && stemmed.endsWith('ti')) continue;
                stemmed = stemmed.slice(0, -s.length);
                break;
            }
        }

        // 3. Remove derivational prefixes (me-, pe-, di-, ter-, ke-, ber-, se-)
        // This is a simplified version of Sastrawi logic
        const prefixes = ['memper', 'pember', 'penge', 'peng', 'peny', 'pen', 'pem', 'per', 'pe', 'ber', 'be', 'ter', 'te', 'me', 'di', 'ke', 'se'];
        for (const p of prefixes) {
            if (stemmed.startsWith(p) && stemmed.length > p.length + 3) {
                // Rule-based root recovery (simplified)
                if (p === 'mem' && 'aiueo'.includes(stemmed[3])) stemmed = 'p' + stemmed.slice(3);
                else if (p === 'men' && 'aiueo'.includes(stemmed[3])) stemmed = 't' + stemmed.slice(3);
                else if (p === 'meng' && 'aiueo'.includes(stemmed[4])) stemmed = 'k' + stemmed.slice(4);
                else if (p === 'meny' && 'aiueo'.includes(stemmed[4])) stemmed = 's' + stemmed.slice(4);
                else stemmed = stemmed.slice(p.length);
                break;
            }
        }

        return stemmed;
    }

    private calculateScore(item: AssistantDataItem, processed: any, fuseScore: number): number {
        let score = (1 - fuseScore) * 10;
        const titleLower = item.title.toLowerCase();
        const descriptionLower = item.description.toLowerCase();
        const keywordsLower = (item.keywords || []).map(k => k.toLowerCase());
        const fullContent = (titleLower + ' ' + keywordsLower.join(' ') + ' ' + descriptionLower);

        // A. Token Matching & N-Gram overlap (Dice)
        processed.tokens.forEach((token: string, i: number) => {
            if (fullContent.includes(token)) {
                score += 10;
                // Bonus for sequential match
                if (i > 0 && fullContent.includes(processed.tokens[i - 1] + ' ' + token)) score += 8;
            }

            // Dice similarity bonus for Title
            const diceTitle = this.calculateDiceCoefficient(token, titleLower);
            if (diceTitle > 0.4) score += (diceTitle * 15);
        });

        // B. Exact hits on title/category (Higher Weight)
        processed.tokens.forEach((token: string) => {
            if (titleLower.includes(token)) score += 20;
            if (item.category.toLowerCase().includes(token)) score += 25;
            if (keywordsLower.includes(token)) score += 15;
        });

        // C. Phrase overlap (Dice Coefficient for full query vs title)
        const fullQueryDice = this.calculateDiceCoefficient(processed.tokens.join(''), titleLower.replace(/\s/g, ''));
        if (fullQueryDice > 0.3) score += (fullQueryDice * 40);

        // D. Context & Business Logic
        if (this.history.lastCategory === item.category) score += 10;
        if (item.is_recommended) score += 25;

        // E. Punctuation Intelligence Boost
        if (processed.signals?.isQuestion) {
            // Favor items with explicit answers for questions
            if (item.answer) score += 15;
            // Also slight boost for categories that answer common questions
            if (item.category.toLowerCase().includes('layanan') || item.category.toLowerCase().includes('syarat')) score += 5;
        }

        if (processed.signals?.isUrgent) {
            score += 10; // General boost for urgent queries
        }

        const intent = this.detectIntent(processed);
        if (intent.startsWith('sales_')) {
            if (item.price_numeric || item.sale_price) score += 30;
            if (item.badge_text) score += 15;
            if (item.category.toLowerCase().includes('produk') || item.category.toLowerCase().includes('layanan')) score += 20;
        }

        return score;
    }

    private detectIntent(processed: any): string {
        // Multi-language default sales triggers
        const defaultSalesTriggers = {
            'beli': ['beli', 'pesan', 'ambil', 'order', 'checkout', 'booking', 'buy', 'purchase', 'get'],
            'harga': ['harga', 'biaya', 'price', 'budget', 'bayar', 'cicilan', 'dp', 'murah', 'cost', 'payment', 'cheap'],
            'promo': ['promo', 'diskon', 'discount', 'sale', 'hemat', 'bonus', 'voucher', 'off']
        };

        const triggers = { ...defaultSalesTriggers, ...(this.config.salesTriggers || {}) };

        // Stem tokens for intent matching as well
        const stemmedTokens = processed.tokens.map((t: string) => this.stemIndonesian(t));

        for (const [intent, tokens] of Object.entries(triggers)) {
            if (tokens.some(t => stemmedTokens.includes(t) || processed.tokens.includes(t))) return `sales_${intent}`;
        }

        if (!this.config.intentRules) return 'fuzzy';

        for (const rule of this.config.intentRules) {
            const entityMatch = !rule.conditions.entities || rule.conditions.entities.some(e => processed.entities[e]);
            const tokenMatch = !rule.conditions.tokens || rule.conditions.tokens.some(t => processed.tokens.includes(t) || stemmedTokens.includes(t));

            if (entityMatch && tokenMatch) return rule.intent;
        }

        return 'fuzzy';
    }
}
