import type { AssistantDataItem, AssistantResult, AssistantConfig, ComparisonItem, ComparisonResult } from "./types";
import Fuse from "./lib/fuse";
import { Stemmer, Tokenizer } from "./lib/sastrawi";
import {
    DEFAULT_PHONETIC_MAP,
    DEFAULT_STOP_WORDS,
    DEFAULT_SEMANTIC_MAP,
    DEFAULT_SALES_TRIGGERS,
    DEFAULT_CHAT_TRIGGERS,
    DEFAULT_CONTACT_TRIGGERS,
    DEFAULT_COMPARISON_LABELS,
    DEFAULT_ATTRIBUTE_EXTRACTORS,
    DEFAULT_LABEL_MAP,
    DEFAULT_UI_CONFIG,
    DEFAULT_CONJUNCTIONS,
    DEFAULT_FEATURE_PATTERNS,
    DEFAULT_SCHEMA
} from "./defaults";
import { formatCurrency } from "./utils";

export class AssistantEngine {
    private searchData: AssistantDataItem[];
    private Fuse: any;
    private fuse: any;
    private config: AssistantConfig;

    private history: {
        lastCategory: string | null;
        lastItemId: string | null;
        detectedEntities: Set<string>;
    };

    private stemmer: Stemmer;
    private tokenizer: Tokenizer;

    constructor(
        searchData: AssistantDataItem[],
        FuseClass: any = Fuse,
        config: AssistantConfig = {}
    ) {
        this.searchData = searchData || [];
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
            lastItemId: null,
            detectedEntities: new Set(),
        };

        this.stemmer = new Stemmer();
        this.tokenizer = new Tokenizer();

        this.initFuse();
    }

    /**
     * Add new data entries to the engine dynamically
     */
    public addData(data: AssistantDataItem[]) {
        this.searchData = [...this.searchData, ...data];
        this.initFuse();
    }

    private initFuse() {
        if (this.Fuse) {
            this.fuse = new this.Fuse(this.searchData, {
                keys: [
                    { name: "title", weight: 0.8 },
                    { name: "keywords", weight: 0.5 },
                    { name: "description", weight: 0.2 },
                    { name: "content", weight: 0.1 },
                ],
                threshold: 0.45,
                includeScore: true,
                useExtendedSearch: true,
            });
        }
    }

    private autoCorrect(word: string): string {
        const phoneticMap = { ...DEFAULT_PHONETIC_MAP, ...(this.config.phoneticMap || {}) };

        for (const [correct, typos] of Object.entries(phoneticMap)) {
            if (typos.includes(word)) return correct;
        }
        return word;
    }

    private preprocess(query: string) {
        const signals = {
            isQuestion: query.includes('?'),
            isUrgent: query.includes('!'),
        };

        const stopWords = new Set([...DEFAULT_STOP_WORDS, ...(this.config.stopWords || [])]);
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
        const semanticMap = { ...DEFAULT_SEMANTIC_MAP, ...(this.config.semanticMap || {}) };

        filteredWords.forEach(w => {
            if (semanticMap[w]) {
                expansion.push(...semanticMap[w]);
            }
            // Also check expansion for stemmed version if different
            const stem = this.stemIndonesian(w);
            if (stem !== w && semanticMap[stem]) {
                expansion.push(...semanticMap[stem]);
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
        // Compound Query Handling: Split query by conjunctions and punctuations
        let conjunctions = this.config.conjunctions || DEFAULT_CONJUNCTIONS;

        // Convert array of strings to regex if needed
        if (Array.isArray(conjunctions)) {
            const escaped = conjunctions.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            conjunctions = new RegExp(`\\s+(?:${escaped.join('|')})\\s+|[?!;]|,`, 'gi');
        }

        let subQueries = query.split(conjunctions as RegExp).map(q => q.trim()).filter(q => q.length > 0);

        // Smart Trigger Splitting: If a sub-query still has multiple triggers from DIFFERENT intent categories, split it
        const salesTriggers = { ...DEFAULT_SALES_TRIGGERS, ...(this.config.salesTriggers || {}) };

        // Map each trigger word to its intent category
        const triggerMap: Record<string, string> = {};
        for (const [intent, words] of Object.entries(salesTriggers)) {
            words.forEach(w => triggerMap[w.toLowerCase()] = intent);
        }

        const refinedQueries: string[] = [];
        for (const subQ of subQueries) {
            const words = subQ.split(/\s+/);
            let current = "";
            let currentIntentCategory: string | null = null;

            for (let i = 0; i < words.length; i++) {
                const word = words[i].toLowerCase();
                const cleanWord = word.replace(/[^\w]/g, '');
                const intentCategory = triggerMap[cleanWord];

                // Split if we find a trigger that belongs to a DIFFERENT category than what we've seen in this sub-query
                if (intentCategory && currentIntentCategory && intentCategory !== currentIntentCategory && current.length > 0) {
                    refinedQueries.push(current.trim());
                    current = words[i];
                    currentIntentCategory = intentCategory;
                } else {
                    if (intentCategory) currentIntentCategory = intentCategory;
                    current += (current ? " " : "") + words[i];
                }
            }
            if (current) refinedQueries.push(current.trim());
        }

        subQueries = refinedQueries;

        if (subQueries.length > 1) {
            let combinedResults: AssistantDataItem[] = [];
            let combinedAnswerParts: string[] = [];
            let combinedEntities: Record<string, boolean> = {};
            let finalIntent = 'compound';
            let maxConfidence = 0;

            for (const subQ of subQueries) {
                const subResult = await this.executeSubSearch(subQ);

                subResult.results.forEach(item => {
                    if (!combinedResults.find(r => r.title === item.title)) {
                        combinedResults.push(item);
                    }
                });

                if (subResult.answer) combinedAnswerParts.push(subResult.answer);
                combinedEntities = { ...combinedEntities, ...subResult.entities };
                maxConfidence = Math.max(maxConfidence, subResult.confidence);
            }

            const joiner = this.config.subSearchJoiner || DEFAULT_UI_CONFIG.subSearchJoiner;
            const limit = this.config.resultLimit || DEFAULT_UI_CONFIG.resultLimit;

            return {
                results: combinedResults.slice(0, limit),
                intent: finalIntent,
                entities: combinedEntities,
                confidence: maxConfidence,
                answer: combinedAnswerParts.join(joiner).replace(/\.\./g, '.')
            };
        }

        return this.executeSubSearch(query);
    }

    private async executeSubSearch(query: string): Promise<AssistantResult> {
        const limit = this.config.resultLimit || DEFAULT_UI_CONFIG.resultLimit;
        const locale = this.config.locale || DEFAULT_UI_CONFIG.locale;
        const currency = this.config.currencySymbol || DEFAULT_UI_CONFIG.currencySymbol;
        const templates = { ...DEFAULT_UI_CONFIG.answerTemplates, ...(this.config.answerTemplates || {}) };

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

                const mergedResults = results.reduce((acc, curr) => {
                    acc.results.push(...(curr.results || []));
                    if (curr.intent && curr.intent !== 'fuzzy') acc.intent = curr.intent;
                    acc.entities = { ...acc.entities, ...(curr.entities || {}) };
                    return acc;
                }, { results: [], intent: 'fuzzy', entities: {}, confidence: 0 } as AssistantResult);

                if (mergedResults.results.length > 0) {
                    const processedForRemote = this.preprocess(query);
                    const ranked = mergedResults.results.map((item: AssistantDataItem) => ({
                        item,
                        score: this.calculateScore(item, processedForRemote, 0.5)
                    })).sort((a: any, b: any) => b.score - a.score);

                    return {
                        ...mergedResults,
                        results: ranked.map((r: any) => r.item).slice(0, limit),
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
            const fuseResults = this.fuse.search(processed.expanded.join(' | '));
            candidates = fuseResults.map((f: any) => ({
                item: f.item,
                fuseScore: f.score
            }));
        }

        // Add history context to candidates if it's not already there
        if (this.history.lastItemId) {
            const lastItem = this.searchData.find(i => i.title === this.history.lastItemId);
            if (lastItem && !candidates.find(c => c.item.title === lastItem.title)) {
                // Score 12 ensures it passes the standard 10 threshold for results
                candidates.push({ item: lastItem, fuseScore: 0.1 });
            }
        }

        const finalResults = candidates.map(c => {
            const score = this.calculateScore(c.item, processed, c.fuseScore);
            return { item: c.item, score };
        });

        finalResults.sort((a, b) => b.score - a.score);

        if (finalResults.length > 0) {
            this.history.lastCategory = finalResults[0].item.category;
            this.history.lastItemId = finalResults[0].item.title;
        }

        const intent = this.detectIntent(processed);
        const isConversational = intent.startsWith('chat_');

        const topMatches = finalResults
            .filter(r => r.score > 10 || (isConversational && r.score > 5))
            .map(r => r.item)
            .slice(0, limit);

        // Dynamic Answer Logic based on Intent & Templates
        let answer = topMatches[0]?.answer || "";
        if (topMatches.length > 0) {
            const topItem = topMatches[0];
            const attributes = this.extractAttributes(topItem);

            if (intent === 'sales_harga') {
                const harga = topItem.sale_price || topItem.price_numeric;
                if (harga) {
                    answer = templates.price!
                        .replace('{title}', topItem.title)
                        .replace('{currency}', '') // Remove this as formatCurrency already includes it
                        .replace('{price}', formatCurrency(harga, currency, locale))
                        .replace('  ', ' '); // Clean up double space if any
                }
            } else if (intent === 'sales_fitur' || processed.tokens.includes('fitur') || processed.tokens.includes('fasilitas') || processed.tokens.includes('keunggulan')) {
                const schema = { ...DEFAULT_SCHEMA, ...(this.config.schema || {}) };
                const fitur = attributes[schema.FEATURES] || topItem.description;
                answer = templates.features!
                    .replace('{title}', topItem.title)
                    .replace('{features}', fitur);
            }
        }

        // Fallback friendly responses
        if (!answer) {
            const fallback = { ...DEFAULT_UI_CONFIG.fallbackResponses, ...(this.config.fallbackIntentResponses || {}) };
            if (intent === 'chat_greeting') {
                answer = fallback['chat_greeting']!;
            } else if (intent === 'chat_thanks') {
                answer = fallback['chat_thanks']!;
            } else if (intent === 'chat_contact') {
                answer = fallback['chat_contact']!;
            } else if (!isConversational && topMatches.length === 0) {
                answer = templates.noResults!;
            }
        }

        // F. Crawl Mode Snippet Extraction (If no answer found but content exists)
        if ((!answer || answer === templates.noResults) && topMatches.length > 0 && topMatches[0].content) {
            const snippet = this.extractSnippet(topMatches[0].content, processed.tokens);
            if (snippet) {
                answer = snippet;
            }
        }

        return {
            results: topMatches,
            intent: intent,
            entities: processed.entities,
            confidence: finalResults.length > 0 ? Math.min(Math.round(finalResults[0].score * 2), 100) : (isConversational ? 80 : 0),
            answer: answer
        };
    }

    private calculateDiceCoefficient(s1: string, s2: string): number {
        if (!s1 || !s2) return 0;
        const getBigrams = (s: string) => {
            const bigrams = new Set();
            for (let i = 0; i < s.length - 1; i++) bigrams.add(s.substring(i, i + 2));
            return bigrams;
        };
        const b1 = getBigrams(s1);
        const b2 = getBigrams(s2);
        let intersect = 0;
        b1.forEach(b => { if (b2.has(b)) intersect++; });
        return (2 * intersect) / (b1.size + b2.size);
    }

    private stemIndonesian(word: string): string {
        return this.stemmer.stem(word);
    }

    private calculateScore(item: AssistantDataItem, processed: any, fuseScore: number): number {
        let score = (1 - fuseScore) * 10;
        const titleLower = item.title.toLowerCase();
        const descriptionLower = item.description.toLowerCase();
        const keywordsLower = (item.keywords || []).map(k => k.toLowerCase());
        const contentLower = (item.content || '').toLowerCase();

        // Include full content in the search scope
        const fullContent = (titleLower + ' ' + keywordsLower.join(' ') + ' ' + descriptionLower + ' ' + contentLower);

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
            if (titleLower.includes(token)) score += 25;
            if (item.category.toLowerCase().includes(token)) score += 25;
            if (keywordsLower.includes(token)) score += 20;
        });

        // C. Phrase overlap (Dice Coefficient for full query vs title)
        const fullQueryDice = this.calculateDiceCoefficient(processed.tokens.join(''), titleLower.replace(/\s/g, ''));
        if (fullQueryDice > 0.3) score += (fullQueryDice * 40);

        // D. Context & Business Logic
        if (this.history.lastCategory === item.category) score += 10;
        if (this.history.lastItemId === item.title) score += 20; // Stronger boost for same item

        if (item.is_recommended) {
            score += 30;
            // Extra super-boost for crawler results that are recommended (set in controller.ts)
            const crawlerCat = this.config.crawlerCategory || 'Page';
            if (item.category === crawlerCat) score += 50;
        }

        // E. Punctuation Intelligence Boost
        if (processed.signals?.isQuestion) {
            // Favor items with explicit answers for questions
            if (item.answer) score += 15;
            // Also slight boost for categories that answer common questions
            if (item.category.toLowerCase().includes('layanan') || item.category.toLowerCase().includes('syarat')) score += 5;
        }

        if (processed.signals?.isUrgent) {
            score += 10;
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
        // Stem tokens for intent matching
        const stemmedTokens = processed.tokens.map((t: string) => this.stemIndonesian(t));

        // 1. Contact Triggers (High Priority)
        const contactTriggers = [...DEFAULT_CONTACT_TRIGGERS, ...(this.config.contactTriggers || [])];
        if (contactTriggers.some(t => stemmedTokens.includes(t) || processed.tokens.includes(t))) {
            return 'chat_contact';
        }

        // 2. Custom Intent Rules
        if (this.config.intentRules) {
            for (const rule of this.config.intentRules) {
                const entityMatch = !rule.conditions.entities || rule.conditions.entities.some(e => processed.entities[e]);
                const tokenMatch = !rule.conditions.tokens || rule.conditions.tokens.some(t => processed.tokens.includes(t) || stemmedTokens.includes(t));
                if (entityMatch && tokenMatch) return rule.intent;
            }
        }

        // 3. Basic Chat Triggers (Greetings, Thanks)
        const chatTriggers = { ...DEFAULT_CHAT_TRIGGERS, ...(this.config.conversationTriggers || {}) };
        for (const [intent, tokens] of Object.entries(chatTriggers)) {
            if (tokens.some(t => stemmedTokens.includes(t) || processed.tokens.includes(t))) return `chat_${intent}`;
        }

        // 4. Sales Triggers (Product intents)
        const triggers = { ...DEFAULT_SALES_TRIGGERS, ...(this.config.salesTriggers || {}) };
        for (const [intent, tokens] of Object.entries(triggers)) {
            if (tokens.some(t => stemmedTokens.includes(t) || processed.tokens.includes(t))) return `sales_${intent}`;
        }

        return 'fuzzy';
    }

    private extractSnippet(content: string, queryTokens: string[]): string {
        if (!content || !queryTokens || queryTokens.length === 0) return "";

        // Standardize content - remove excessive whitespace
        const cleanContent = content.replace(/\s+/g, ' ').trim();

        // Split into sentences (simple rule: . ? or ! followed by space)
        const sentences = cleanContent.split(/(?<=[.!?])\s+/);

        let bestSentence = "";
        let maxOverlap = 0;

        for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase();
            let overlap = 0;

            queryTokens.forEach(token => {
                if (lowerSentence.includes(token.toLowerCase())) {
                    overlap++;
                }
            });

            if (overlap > maxOverlap) {
                maxOverlap = overlap;
                bestSentence = sentence;
            }
        }

        // If high enough overlap, return sentence. Otherwise returns first paragraph or first 150 chars.
        if (maxOverlap > 0) {
            // Find the index of the best sentence to get context if it's too short
            const index = sentences.indexOf(bestSentence);
            let result = bestSentence;

            // Add one sentence before and after for context if the best sentence is short (< 40 chars)
            if (result.length < 40) {
                if (index > 0) result = sentences[index - 1] + " " + result;
                if (index < sentences.length - 1) result = result + " " + sentences[index + 1];
            }

            return result.trim();
        }

        return cleanContent.substring(0, 200).trim() + "...";
    }

    // ===== PRODUCT COMPARISON SYSTEM =====

    /**
     * Get comparison triggers from config
     */
    private getComparisonTriggers(): string[] {
        return this.config.comparisonTriggers || [];
    }

    /**
     * Get labels for comparison output from config
     */
    private getComparisonLabels() {
        return { ...DEFAULT_COMPARISON_LABELS, ...(this.config.comparisonLabels || {}) };
    }

    /**
     * Check if query is a comparison request
     */
    public isComparisonQuery(query: string): boolean {
        const triggers = this.getComparisonTriggers();
        const queryLower = query.toLowerCase();

        // 1. Direct match
        if (triggers.some(t => queryLower.includes(t))) return true;

        // 2. Fuzzy match for triggers
        const words = queryLower.split(/\s+/);
        for (const word of words) {
            if (triggers.some(t => this.calculateDiceCoefficient(word, t) > 0.7)) return true;
        }

        return false;
    }

    /**
     * Extract attributes from a product's description or extra data
     */
    private extractAttributes(item: AssistantDataItem): Record<string, string | number | boolean> {
        const attributes: Record<string, string | number | boolean> = {};
        const extractors = { ...DEFAULT_ATTRIBUTE_EXTRACTORS, ...(this.config.attributeExtractors || {}) };

        // 1. Extract from description using regex
        for (const [attr, pattern] of Object.entries(extractors)) {
            const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
            const match = item.description.match(regex);
            if (match && match[1]) {
                attributes[attr] = match[1].trim();
            }
        }

        // 2. Include numeric fields from schema
        const schema = { ...DEFAULT_SCHEMA, ...(this.config.schema || {}) };
        if (item.price_numeric) attributes[schema.PRICE] = item.price_numeric;
        if (item.sale_price) attributes[schema.PRICE_PROMO] = item.sale_price;
        if (item.badge_text) attributes[schema.BADGE] = item.badge_text;
        if (item.is_recommended) attributes[schema.RECOMMENDED] = item.is_recommended;

        // 3. Features extraction
        const featurePatterns = this.config.featurePatterns || DEFAULT_FEATURE_PATTERNS;
        const features: string[] = [];
        for (const pattern of featurePatterns) {
            const regex = typeof pattern === 'string' ? new RegExp(pattern, 'gi') : pattern;
            let match;
            while ((match = regex.exec(item.description)) !== null) {
                if (match[1]) features.push(match[1].trim());
            }
        }

        if (features.length > 0) {
            attributes[schema.FEATURES] = features.join(', ');
        }

        // 4. Custom data passthrough (if not already extracted)
        for (const [key, value] of Object.entries(item)) {
            if (!['title', 'description', 'answer', 'url', 'category', 'keywords', 'price_numeric', 'sale_price', 'badge_text', 'cta_label', 'cta_url', 'image_url', 'is_recommended'].includes(key)) {
                attributes[key] = value;
            }
        }

        return attributes;
    }

    /**
     * Calculate a comparison suitability score
     */
    private calculateComparisonScore(item: AssistantDataItem, attributes: Record<string, any>): number {
        let score = 0;
        const schema = { ...DEFAULT_SCHEMA, ...(this.config.schema || {}) };

        // Recommendation bonus
        if (item.is_recommended) score += 30;

        // Price logic
        if (item.sale_price && item.price_numeric && item.sale_price < item.price_numeric) {
            score += 20; // High value on sale items
        }

        // Badge bonus
        if (item.badge_text) {
            const badgeLower = item.badge_text.toLowerCase();
            if (badgeLower.includes('popular') || badgeLower.includes('populer')) score += 20;
            if (badgeLower.includes('new') || badgeLower.includes('baru')) score += 15;
            if (badgeLower.includes('sale') || badgeLower.includes('promo')) score += 15;
        }

        // Feature richness bonus
        const featureCount = Object.keys(attributes).length;
        score += Math.min(featureCount * 5, 25);

        // Rating bonus
        if (attributes[schema.RATING]) {
            const rating = parseFloat(String(attributes[schema.RATING]));
            if (!isNaN(rating)) score += rating * 5;
        }

        // Warranty bonus
        if (attributes[schema.WARRANTY]) {
            const warrantyMatch = String(attributes[schema.WARRANTY]).match(/(\d+)/);
            if (warrantyMatch) {
                const years = parseInt(warrantyMatch[1]);
                score += Math.min(years * 10, 30);
            }
        }

        return score;
    }

    /**
     * Generate recommendation reasons
     */
    private generateReasons(item: ComparisonItem, allItems: ComparisonItem[]): string[] {
        const reasons: string[] = [];
        const labels = this.getComparisonLabels();

        // Price comparison
        if (item.salePrice && item.price) {
            const discount = Math.round(((item.price - item.salePrice) / item.price) * 100);
            reasons.push(labels.discount!.replace('{discount}', discount.toString()));
        }

        // Cheapest check
        const prices = allItems.filter(i => i.price || i.salePrice).map(i => i.salePrice || i.price || Infinity);
        const myPrice = item.salePrice || item.price || Infinity;
        if (myPrice === Math.min(...prices) && prices.length > 1) {
            reasons.push(labels.cheapest!);
        }

        // Most features
        const featureCounts = allItems.map(i => Object.keys(i.attributes).length);
        if (Object.keys(item.attributes).length === Math.max(...featureCounts) && featureCounts.length > 1) {
            reasons.push(labels.mostFeatures!);
        }

        return reasons;
    }

    /**
     * Generate Table HTML
     */
    private generateTableHtml(items: ComparisonItem[], attributeLabels: string[]): string {
        const headers = items.map(i => `<th>${i.title}${i.isRecommended ? ' ✨' : ''}</th>`).join('');
        let rows = '';

        for (const attr of attributeLabels) {
            rows += `<tr><td><strong>${this.formatAttributeLabel(attr)}</strong></td>`;
            for (const item of items) {
                const value = item.attributes[attr];
                let displayValue = '-';
                if (value !== undefined && value !== null) {
                    if (typeof value === 'boolean') {
                        displayValue = value ? '✓' : '✗';
                    } else {
                        displayValue = String(value);
                    }
                }
                rows += `<td>${displayValue}</td>`;
            }
            rows += '</tr>';
        }

        return `<table class="comparison-table"><thead><tr><th>Fitur</th>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    }

    /**
     * Generate Table Markdown
     */
    private generateTableMarkdown(items: ComparisonItem[], attributeLabels: string[]): string {
        const headers = items.map(i => i.title + (i.isRecommended ? ' ✨' : '')).join(' | ');
        let md = `| Fitur | ${headers} |\n`;
        md += `| :--- | ${items.map(() => ':---').join(' | ')} |\n`;

        for (const attr of attributeLabels) {
            md += `| **${this.formatAttributeLabel(attr)}** |`;
            for (const item of items) {
                const value = item.attributes[attr];
                let displayValue = '-';
                if (value !== undefined && value !== null) {
                    if (typeof value === 'boolean') {
                        displayValue = value ? '✓' : '✗';
                    } else {
                        displayValue = String(value);
                    }
                }
                md += ` ${displayValue} |`;
            }
            md += '\n';
        }

        return md;
    }

    /**
     * Format attribute label for display
     */
    private formatAttributeLabel(attr: string): string {
        const labels = { ...DEFAULT_LABEL_MAP, ...(this.config.attributeLabels || {}) };
        return labels[attr] || attr.charAt(0).toUpperCase() + attr.slice(1);
    }

    /**
     * Main comparison method - compares products based on query or category
     */
    public async compareProducts(query: string, category?: string, maxItems: number = 4): Promise<ComparisonResult> {
        // Get relevant products
        let candidates: AssistantDataItem[] = [];

        if (category) {
            // Filter by category
            candidates = this.searchData.filter(item =>
                item.category.toLowerCase().includes(category.toLowerCase())
            );
        } else {
            // Use search to find relevant products
            const searchResult = await this.search(query);
            candidates = searchResult.results;
        }

        // If still no candidates, try to extract category from query
        if (candidates.length === 0) {
            const processedForCompare = this.preprocess(query);
            for (const item of this.searchData) {
                const titleLower = item.title.toLowerCase();
                const categoryLower = item.category.toLowerCase();
                if (processedForCompare.tokens.some(t => titleLower.includes(t) || categoryLower.includes(t))) {
                    candidates.push(item);
                }
            }
        }

        // FALLBACK: If still no candidates, use all products for general comparison
        if (candidates.length === 0) {
            candidates = [...this.searchData];
        }

        // Limit candidates
        candidates = candidates.slice(0, maxItems);

        // Extract attributes for each candidate
        const comparisonItems: ComparisonItem[] = candidates.map(item => {
            const attributes = this.extractAttributes(item);
            const score = this.calculateComparisonScore(item, attributes);

            return {
                title: item.title,
                attributes,
                score,
                isRecommended: item.is_recommended || false,
                url: item.url,
                price: item.price_numeric,
                salePrice: item.sale_price
            };
        });

        // Sort by score
        comparisonItems.sort((a, b) => b.score - a.score);

        // Collect all unique attribute labels
        const allAttributes = new Set<string>();
        for (const item of comparisonItems) {
            for (const attr of Object.keys(item.attributes)) {
                allAttributes.add(attr);
            }
        }
        const attributeLabels = Array.from(allAttributes);

        // Generate recommendation
        let recommendation = null;
        if (comparisonItems.length > 0) {
            const bestItem = comparisonItems[0];
            const reasons = this.generateReasons(bestItem, comparisonItems);
            recommendation = {
                item: bestItem,
                reasons
            };
        }

        // Generate tables
        const tableHtml = this.generateTableHtml(comparisonItems, attributeLabels);
        const tableMarkdown = this.generateTableMarkdown(comparisonItems, attributeLabels);

        return {
            items: comparisonItems,
            attributeLabels,
            recommendation,
            tableHtml,
            tableMarkdown
        };
    }

    /**
     * Enhanced search that auto-detects comparison intent
     */
    public async searchWithComparison(query: string): Promise<AssistantResult & { comparison?: ComparisonResult }> {
        const baseResult = await this.search(query);

        // Check if this is a comparison query
        if (this.isComparisonQuery(query)) {
            const comparison = await this.compareProducts(query);
            const labels = this.getComparisonLabels();

            // Build answer with comparison
            let answer = '';
            if (comparison.recommendation) {
                answer = `${labels.recommendation}: **${comparison.recommendation.item.title}**\n\n`;
                if (comparison.recommendation.reasons.length > 0) {
                    answer += `${labels.reasons}:\n`;
                    for (const reason of comparison.recommendation.reasons) {
                        answer += `• ${reason}\n`;
                    }
                }
                answer += `\n${comparison.tableMarkdown}`;
            } else {
                answer = labels.noProducts;
            }

            return {
                ...baseResult,
                intent: 'comparison',
                answer,
                comparison
            };
        }

        return baseResult;
    }
}
