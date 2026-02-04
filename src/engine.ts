import Fuse from "./lib/fuse";
import { Stemmer, Tokenizer } from "./lib/sastrawi";
import type {
    AssistantDataItem,
    AssistantConfig,
    AssistantResult,
    ComparisonItem,
    ComparisonResult
} from "./types";
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
    DEFAULT_SCHEMA,
    DEFAULT_REFERENCE_TRIGGERS
} from "./defaults";
import { formatCurrency } from "./utils";
// Enterprise Modules
import { AnalyticsEngine } from "./lib/analytics";
import { MiddlewareManager } from "./lib/middleware";
import { SalesPsychology } from "./lib/sales-psychology";
import { HybridAI } from "./lib/llm-connector";
import { NLPClassifier } from "./lib/nlp-classifier";
import { SentimentAnalyzer } from "./lib/sentiment";
// Security
import { SecurityGuard } from "./lib/security-guard";

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

    // Enterprise Modules
    public analytics: AnalyticsEngine;
    public middleware: MiddlewareManager;
    public salesPsychology: SalesPsychology;
    public hybridAI: HybridAI;
    public nlpClassifier: NLPClassifier;
    public sentimentAnalyzer: SentimentAnalyzer;
    public securityGuard: SecurityGuard;

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

        // Initialize Enterprise Modules
        this.analytics = new AnalyticsEngine(this.config.analytics);
        this.middleware = new MiddlewareManager();
        this.salesPsychology = new SalesPsychology(this.config.salesPsychology);
        this.hybridAI = new HybridAI(this.config.hybridAI);
        this.nlpClassifier = new NLPClassifier(this.config.nlp);
        this.sentimentAnalyzer = new SentimentAnalyzer(this.config.sentiment);
        this.securityGuard = new SecurityGuard(this.config.security);

        this.initFuse();
    }

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
        const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
        const rawWords = cleanQuery.split(/\s+/).filter(w => w.length > 1);
        let correctedWords = rawWords.map(w => this.autoCorrect(w));
        const stemmedWords = correctedWords.map(w => this.stemIndonesian(w));
        const allTokens = [...new Set([...correctedWords, ...stemmedWords])];
        const filteredWords = allTokens.filter(w => !stopWords.has(w));

        const expansion: string[] = [];
        const semanticMap = { ...DEFAULT_SEMANTIC_MAP, ...(this.config.semanticMap || {}) };

        filteredWords.forEach(w => {
            if (semanticMap[w]) expansion.push(...semanticMap[w]);
            const stem = this.stemIndonesian(w);
            if (stem !== w && semanticMap[stem]) expansion.push(...semanticMap[stem]);
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

    public async search(originalQuery: string): Promise<AssistantResult> {
        // 1. Security Check
        const securityResult = this.securityGuard.process(originalQuery);
        if (!securityResult.isValid) {
            return { results: [], intent: 'blocked', entities: {}, confidence: 0, answer: "Maaf, input Anda terdeteksi tidak aman." };
        }

        // 2. Middleware Request Pipeline
        const ctx = await this.middleware.executeRequest(originalQuery);
        if (ctx.stop) return { results: [], intent: 'blocked', entities: {}, confidence: 0 };

        const query = ctx.query;
        this.analytics.track('search', { query });

        // 3. Smart Reference Resolution (Anaphora)
        let enrichedQuery = query;
        if (query.length < 20 && this.history.lastItemId) {
            const followUpTriggers = this.config.referenceTriggers || DEFAULT_REFERENCE_TRIGGERS;
            if (followUpTriggers.some(t => query.toLowerCase().includes(t.toLowerCase()))) {
                enrichedQuery = `${query} ${this.history.lastItemId}`;
            }
        }

        // 4. Sentiment Analysis
        const sentiment = this.sentimentAnalyzer.analyze(originalQuery);

        // 5. Compound Query Handling
        let conjunctions = this.config.conjunctions || DEFAULT_CONJUNCTIONS;
        if (Array.isArray(conjunctions)) {
            const escaped = conjunctions.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            conjunctions = new RegExp(`\\s+(?:${escaped.join('|')})\\s+|[?!;]|,`, 'gi');
        }

        let subQueries = enrichedQuery.split(conjunctions as RegExp).map(q => q.trim()).filter(q => q.length > 0);

        // Smart Trigger Splitting
        const salesTriggers = { ...DEFAULT_SALES_TRIGGERS, ...(this.config.salesTriggers || {}) };
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
                const word = words[i].toLowerCase().replace(/[^\w]/g, '');
                const intentCategory = triggerMap[word];
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
            let maxConfidence = 0;

            for (const subQ of subQueries) {
                const subResult = await this.executeSubSearch(subQ);
                subResult.results.forEach(item => {
                    if (!combinedResults.find(r => r.title === item.title)) combinedResults.push(item);
                });
                if (subResult.answer) combinedAnswerParts.push(subResult.answer);
                combinedEntities = { ...combinedEntities, ...subResult.entities };
                maxConfidence = Math.max(maxConfidence, subResult.confidence);
            }

            const joiner = this.config.subSearchJoiner || DEFAULT_UI_CONFIG.subSearchJoiner;
            const limit = this.config.resultLimit || DEFAULT_UI_CONFIG.resultLimit;

            return {
                results: combinedResults.slice(0, limit),
                intent: 'compound',
                entities: combinedEntities,
                confidence: maxConfidence,
                answer: combinedAnswerParts.join(joiner).replace(/\.\./g, '.'),
                sentiment: {
                    score: sentiment.score,
                    label: sentiment.label,
                    isUrgent: sentiment.isUrgent,
                    intensity: sentiment.intensity
                }
            };
        }

        return this.executeSubSearch(enrichedQuery);
    }

    private async executeSubSearch(query: string): Promise<AssistantResult> {
        const sentiment = this.sentimentAnalyzer.analyze(query);
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
                        confidence: Math.min(Math.round(ranked[0].score * 2), 100),
                        sentiment: {
                            score: sentiment.score,
                            label: sentiment.label,
                            isUrgent: sentiment.isUrgent,
                            intensity: sentiment.intensity
                        }
                    };
                }
            } catch (error) {
                console.error("Remote search orchestration failed, falling back to local:", error);
            }
        }

        const processed = this.preprocess(query);
        if (sentiment.isUrgent) processed.signals.isUrgent = true;

        let candidates: any[] = [];
        if (this.fuse) {
            const fuseResults = this.fuse.search(processed.expanded.join(' | '));
            candidates = fuseResults.map((f: any) => ({ item: f.item, fuseScore: f.score }));
        }

        if (this.history.lastItemId) {
            const lastItem = this.searchData.find(i => i.title === this.history.lastItemId);
            if (lastItem && !candidates.find(c => c.item.title === lastItem.title)) {
                candidates.push({ item: lastItem, fuseScore: 0.1 });
            }
        }

        const finalResults = candidates.map(c => ({
            item: c.item,
            score: this.calculateScore(c.item, processed, c.fuseScore)
        })).sort((a, b) => b.score - a.score);

        if (finalResults.length > 0) {
            this.history.lastCategory = finalResults[0].item.category;
            this.history.lastItemId = finalResults[0].item.title;
        }

        const intent = this.detectIntent(processed);
        const isConversational = intent.startsWith('chat_');
        const topMatches = finalResults
            .filter(r => r.score > 5 || (isConversational && r.score > 3))
            .map(r => r.item)
            .slice(0, limit);

        let answer = topMatches[0]?.answer || "";
        if (topMatches.length > 0) {
            const topItem = topMatches[0];
            const attributes = this.extractAttributes(topItem);
            if (intent === 'sales_harga') {
                const harga = topItem.sale_price || topItem.price_numeric;
                if (harga) {
                    answer = templates.price!
                        .replace('{title}', topItem.title)
                        .replace('{currency}', '')
                        .replace('{price}', formatCurrency(harga, currency, locale))
                        .replace('  ', ' ');
                }
            } else if (intent === 'sales_fitur' || processed.tokens.includes('fitur')) {
                const schema = { ...DEFAULT_SCHEMA, ...(this.config.schema || {}) };
                const fitur = attributes[schema.FEATURES] || topItem.description;
                answer = templates.features!.replace('{title}', topItem.title).replace('{features}', fitur);
            }
        }

        if (!answer) {
            const fallback = { ...DEFAULT_UI_CONFIG.fallbackResponses, ...(this.config.fallbackIntentResponses || {}) };
            if (intent === 'chat_greeting') answer = fallback['chat_greeting']!;
            else if (intent === 'chat_thanks') answer = fallback['chat_thanks']!;
            else if (intent === 'chat_contact') answer = fallback['chat_contact']!;
            else if (!isConversational && topMatches.length === 0) answer = templates.noResults!;
        }

        // Adaptive Response Tuning
        if (answer && answer !== templates.noResults) {
            const prefixesConfig = { ...DEFAULT_UI_CONFIG.sentimentPrefixes, ...(this.config.sentimentPrefixes || {}) };
            if (sentiment.label === 'negative') {
                answer = `${this.salesPsychology.getObjectionPrefix()} ${answer}`;
            } else if (sentiment.label === 'positive' && sentiment.intensity === 'high') {
                const prefixes = prefixesConfig.positive || [];
                if (prefixes.length > 0) answer = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${answer}`;
            }

            if (intent.startsWith('sales_')) {
                if (intent === 'sales_beli') answer += ` ${this.salesPsychology.getClosingQuestion()}`;
                else if (topMatches.length > 0 && topMatches[0].is_recommended) answer += " Produk ini sangat direkomendasikan!";
            }
        }

        return {
            results: topMatches,
            intent: intent,
            entities: processed.entities,
            confidence: finalResults.length > 0 ? Math.min(Math.round(finalResults[0].score * 2), 100) : (isConversational ? 80 : 0),
            answer: answer,
            sentiment: {
                score: sentiment.score,
                label: sentiment.label,
                isUrgent: sentiment.isUrgent,
                intensity: sentiment.intensity
            }
        };
    }

    private calculateDiceCoefficient(s1: string, s2: string): number {
        if (!s1 || !s2) return 0;
        const bigrams = (s: string) => {
            const b = new Set();
            for (let i = 0; i < s.length - 1; i++) b.add(s.substring(i, i + 2));
            return b;
        };
        const b1 = bigrams(s1);
        const b2 = bigrams(s2);
        let intersection = 0;
        b1.forEach(b => { if (b2.has(b)) intersection++; });
        return (2 * intersection) / (b1.size + b2.size);
    }

    private stemIndonesian(word: string): string {
        return this.stemmer.stem(word);
    }

    private calculateScore(item: AssistantDataItem, processed: any, fuseScore: number): number {
        let score = (1 - fuseScore) * 10;
        const titleLower = item.title.toLowerCase();
        const fullContent = (item.title + ' ' + (item.keywords || []).join(' ') + ' ' + item.description + ' ' + (item.content || '')).toLowerCase();

        processed.tokens.forEach((token: string, i: number) => {
            if (fullContent.includes(token)) {
                score += 10;
                if (i > 0 && fullContent.includes(processed.tokens[i - 1] + ' ' + token)) score += 8;
            }
            const dice = this.calculateDiceCoefficient(token, titleLower);
            if (dice > 0.4) score += (dice * 15);
        });

        processed.tokens.forEach((token: string) => {
            if (titleLower.includes(token)) score += 25;
            if (item.category.toLowerCase().includes(token)) score += 25;
        });

        if (this.history.lastItemId === item.title) score += 30;
        if (item.is_recommended) score += 30;

        const intent = this.detectIntent(processed);
        if (processed.signals?.isUrgent) {
            score += 10;
            if (item.category.toLowerCase().match(/stok|ready|cabang/)) score += 25;
        }

        if (intent.startsWith('sales_')) {
            if (item.price_numeric || item.sale_price) score += 30;
            if (item.category.toLowerCase().match(/produk|layanan/)) score += 20;
        }

        if (item.category === (this.config.crawlerCategory || 'Page')) score -= 30;

        return score;
    }

    private detectIntent(processed: any): string {
        const stemmedTokens = processed.tokens.map((t: string) => this.stemIndonesian(t));
        const aiIntent = this.nlpClassifier.classify(processed.tokens.join(' '));
        if (aiIntent && aiIntent.confidence > 0.7) return aiIntent.intent;

        const contactTriggers = [...DEFAULT_CONTACT_TRIGGERS, ...(this.config.contactTriggers || [])];
        if (contactTriggers.some(t => stemmedTokens.includes(t) || processed.tokens.includes(t))) return 'chat_contact';

        const chats = { ...DEFAULT_CHAT_TRIGGERS, ...(this.config.conversationTriggers || {}) };
        for (const [intent, tokens] of Object.entries(chats)) {
            if (tokens.some(t => stemmedTokens.includes(t) || processed.tokens.includes(t))) return `chat_${intent}`;
        }

        const sales = { ...DEFAULT_SALES_TRIGGERS, ...(this.config.salesTriggers || {}) };
        for (const [intent, tokens] of Object.entries(sales)) {
            if (tokens.some(t => stemmedTokens.includes(t) || processed.tokens.includes(t))) return `sales_${intent}`;
        }

        return 'fuzzy';
    }

    private extractAttributes(item: AssistantDataItem): Record<string, string> {
        const attributes: Record<string, string> = { ...item.attributes };
        const extractors = { ...DEFAULT_ATTRIBUTE_EXTRACTORS, ...(this.config.attributeExtractors || {}) };
        const content = item.content || item.description;

        for (const [attr, regex] of Object.entries(extractors)) {
            if (!attributes[attr]) {
                const match = content.match(regex);
                if (match) attributes[attr] = match[1];
            }
        }
        return attributes;
    }

    private calculateComparisonScore(item: AssistantDataItem, attributes: Record<string, string>): number {
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

    private isComparisonQuery(query: string): boolean {
        const triggers = this.config.comparisonTriggers || ["bandingkan", "vs", "lawan", "bedanya", "lebih bagus mana"];
        return triggers.some(t => query.toLowerCase().includes(t.toLowerCase()));
    }

    private getComparisonLabels() {
        return { ...DEFAULT_COMPARISON_LABELS, ...(this.config.comparisonLabels || {}) };
    }

    private generateReasons(item: ComparisonItem, allItems: ComparisonItem[]): string[] {
        const reasons: string[] = [];
        const labels = this.getComparisonLabels();
        if (item.salePrice && item.price) {
            const discount = Math.round(((item.price - item.salePrice) / item.price) * 100);
            reasons.push(labels.discount!.replace('{discount}', discount.toString()));
        }
        const prices = allItems.filter(i => i.price || i.salePrice).map(i => i.salePrice || i.price || Infinity);
        if ((item.salePrice || item.price || Infinity) === Math.min(...prices) && prices.length > 1) reasons.push(labels.cheapest!);
        return reasons;
    }

    private generateTableMarkdown(items: ComparisonItem[], attributeLabels: string[]): string {
        const headers = items.map(i => i.title + (i.isRecommended ? ' ✨' : '')).join(' | ');
        let md = `| Fitur | ${headers} |\n| :--- | ${items.map(() => ':---').join(' | ')} |\n`;
        for (const attr of attributeLabels) {
            md += `| **${this.formatAttributeLabel(attr)}** |`;
            for (const item of items) {
                const val = item.attributes[attr];
                md += ` ${val !== undefined && val !== null ? (typeof val === 'boolean' ? (val ? '✓' : '✗') : val) : '-'} |`;
            }
            md += '\n';
        }
        return md;
    }

    private formatAttributeLabel(attr: string): string {
        const labels = { ...DEFAULT_LABEL_MAP, ...(this.config.attributeLabels || {}) };
        return labels[attr] || attr.charAt(0).toUpperCase() + attr.slice(1);
    }

    public async compareProducts(query: string, category?: string, maxItems: number = 4): Promise<ComparisonResult> {
        let candidates = category ? this.searchData.filter(i => i.category.toLowerCase().includes(category.toLowerCase())) : (await this.search(query)).results;
        candidates = candidates.slice(0, maxItems);
        const items = candidates.map(item => {
            const attrs = this.extractAttributes(item);
            return { title: item.title, attributes: attrs, score: this.calculateComparisonScore(item, attrs), isRecommended: item.is_recommended || false, url: item.url, price: item.price_numeric, salePrice: item.sale_price };
        }).sort((a, b) => b.score - a.score);

        const allAttrs = new Set<string>();
        items.forEach(i => Object.keys(i.attributes).forEach(a => allAttrs.add(a)));
        const labels = Array.from(allAttrs);

        return { items, attributeLabels: labels, recommendation: items.length > 0 ? { item: items[0], reasons: this.generateReasons(items[0], items) } : null, tableHtml: "", tableMarkdown: this.generateTableMarkdown(items, labels) };
    }

    public async searchWithComparison(query: string): Promise<AssistantResult & { comparison?: ComparisonResult }> {
        const base = await this.search(query);
        if (this.isComparisonQuery(query)) {
            const comparison = await this.compareProducts(query);
            const labels = this.getComparisonLabels();
            let answer = comparison.recommendation ? `${labels.recommendation}: **${comparison.recommendation.item.title}**\n\n${comparison.tableMarkdown}` : labels.noProducts;
            return { ...base, intent: 'comparison', answer, comparison };
        }
        return base;
    }
}
