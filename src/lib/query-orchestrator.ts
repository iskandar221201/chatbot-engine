/**
 * Query Orchestrator Sub-Engine
 * Coordinates the search pipeline: Preprocessing -> Intent -> Search -> Scoring -> Response.
 * Handles compound queries, conjunctions, and remote/local coordination.
 */

import { AssistantDataItem, AssistantResult, AssistantConfig, ComparisonResult } from "../types";
import {
    DEFAULT_CONJUNCTIONS,
    DEFAULT_SALES_TRIGGERS,
    DEFAULT_UI_CONFIG,
    DEFAULT_COMPARISON_LABELS,
    DEFAULT_LABEL_MAP
} from "../defaults";
import { DiagnosticTracer } from "./diagnostic-tracer";

export class QueryOrchestrator {
    private engines: {
        prepro: any;
        intent: any;
        scoring: any;
        context: any;
        response: any;
        security: any;
        analytics: any;
        middleware: any;
        salesPsychology: any;
        sentiment: any;
    };
    private config: AssistantConfig;
    private searchData: AssistantDataItem[];
    private fuse: any;

    constructor(
        engines: any,
        searchData: AssistantDataItem[],
        fuse: any,
        config: AssistantConfig
    ) {
        this.engines = engines;
        this.searchData = searchData;
        this.fuse = fuse;
        this.config = config;
    }

    /**
     * Main Search Entry Point
     */
    public async search(originalQuery: string): Promise<AssistantResult> {
        const tracer = new DiagnosticTracer();

        // 1. Security Check
        tracer.start('security_check');
        const securityResult = this.engines.security.process(originalQuery);
        tracer.stop('security_check', { isValid: securityResult.isValid });

        if (!securityResult.isValid) {
            return {
                results: [],
                intent: 'blocked',
                entities: {},
                confidence: 0,
                answer: "Maaf, input Anda terdeteksi tidak aman."
            };
        }

        // 2. Middleware Request Pipeline
        tracer.start('middleware_request');
        const ctx = await this.engines.middleware.executeRequest(originalQuery);
        tracer.stop('middleware_request');

        if (ctx.stop) return { results: [], intent: 'blocked', entities: {}, confidence: 0 };

        const query = ctx.query;
        this.engines.analytics.track('search', { query });

        // 3. Resolve Anaphora
        tracer.start('anaphora_resolution');
        const enrichedQuery = this.engines.context.resolveAnaphora(query);
        tracer.stop('anaphora_resolution');

        // 4. Sentiment Analysis
        tracer.start('sentiment_analysis');
        const sentiment = this.engines.sentiment.analyze(originalQuery);
        tracer.stop('sentiment_analysis');

        // 5. Compound Parsing
        let conjunctions = this.config.conjunctions || DEFAULT_CONJUNCTIONS;
        if (Array.isArray(conjunctions)) {
            const escaped = conjunctions.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            conjunctions = new RegExp(`\\s+(?:${escaped.join('|')})\\s+|[?!;]|,`, 'gi');
        }

        let subQueries = enrichedQuery.split(conjunctions as RegExp).map((q: string) => q.trim()).filter((q: string) => q.length > 0);

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

        // 6. Execution
        if (subQueries.length > 1) {
            let combinedResults: AssistantDataItem[] = [];
            let combinedAnswerParts: string[] = [];
            let combinedEntities: Record<string, boolean> = {};
            let maxConfidence = 0;

            for (const subQ of subQueries) {
                const subResult = await this.executeSubSearch(subQ, tracer);
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
                },
                diagnostics: tracer.getEvents()
            };
        }

        return this.executeSubSearch(enrichedQuery, tracer);
    }

    /**
     * Internal Search Coordinator
     */
    public async executeSubSearch(query: string, tracer: DiagnosticTracer): Promise<AssistantResult> {
        const limit = this.config.resultLimit || DEFAULT_UI_CONFIG.resultLimit;

        // 1. Remote Search Check
        if (this.config.searchMode === 'remote' && this.config.apiUrl) {
            const remoteResult = await this.handleRemoteSearch(query, { score: 0, label: 'neutral' }, limit);
            if (remoteResult) return remoteResult;
        }

        // 2. Preprocessing
        tracer.start('preprocessing');
        const processed = this.engines.prepro.process(query);
        tracer.stop('preprocessing', { tokenCount: processed.tokens.length });

        tracer.start('sentiment_analysis');
        const sentiment = this.engines.sentiment.analyze(query);
        tracer.stop('sentiment_analysis');

        if (sentiment.isUrgent) processed.signals.isUrgent = true;

        // 3. Local Search (Fuse)
        let candidates: any[] = [];
        if (this.fuse) {
            tracer.start('fuse_search');
            const fuseResults = this.fuse.search(processed.expanded.join(' | '));
            candidates = fuseResults.map((f: any) => ({ item: f.item, fuseScore: f.score }));
            tracer.stop('fuse_search', { rawResultCount: candidates.length });
        }

        // 4. Inject Context (History)
        const contextState = this.engines.context.getState();
        if (contextState.lastItemId) {
            const lastItem = this.searchData.find((i: AssistantDataItem) => i.title === contextState.lastItemId);
            if (lastItem && !candidates.find(c => c.item.title === lastItem.title)) {
                candidates.push({ item: lastItem, fuseScore: 0.1 });
            }
        }

        // 5. Intent Detection
        tracer.start('intent_detection');
        const stemmedTokens = processed.tokens.map((t: string) => this.engines.prepro.stem(t));
        const intent = this.engines.intent.detect(processed.tokens.join(' '), processed.tokens, stemmedTokens);
        tracer.stop('intent_detection', { intent });

        // 6. Ranking
        tracer.start('scoring');
        const finalResults = candidates.map(c => {
            const { score, breakdown } = this.engines.scoring.calculate(c.item, processed, c.fuseScore, intent, contextState);
            return {
                item: { ...c.item, scoreBreakdown: breakdown },
                score
            };
        }).sort((a, b) => b.score - a.score);
        tracer.stop('scoring', { finalCandidateCount: finalResults.length });

        const isConversational = intent.startsWith('chat_');
        const topMatches = finalResults
            .filter(r => r.score > 5 || (isConversational && r.score > 3))
            .map(r => r.item)
            .slice(0, limit);

        // 7. Context & Sentiment Wrap
        const finalResult: AssistantResult = {
            results: topMatches,
            intent: intent,
            entities: processed.entities,
            confidence: finalResults.length > 0 ? Math.min(Math.round(finalResults[0].score * 2), 100) : (isConversational ? 80 : 0),
            sentiment: {
                score: sentiment.score,
                label: sentiment.label,
                isUrgent: sentiment.isUrgent,
                intensity: sentiment.intensity
            },
            scoreBreakdown: finalResults.length > 0 ? finalResults[0].item.scoreBreakdown : undefined,
            diagnostics: tracer.getEvents()
        };

        this.engines.context.update(finalResult);

        // 8. Response Composition
        tracer.start('response_composition');
        const answer = this.engines.response.compose(
            finalResult,
            intent,
            isConversational,
            (item: AssistantDataItem) => this.engines.prepro.extractAttributes(item)
        );
        tracer.stop('response_composition');

        return {
            ...finalResult,
            answer: answer,
            diagnostics: tracer.getEvents()
        };
    }

    private async handleRemoteSearch(query: string, sentiment: any, limit: number): Promise<AssistantResult | null> {
        try {
            const urls = Array.isArray(this.config.apiUrl) ? this.config.apiUrl : [this.config.apiUrl];
            const results = await Promise.all(urls.map(async (url) => {
                try {
                    const response = await fetch(`${url}?q=${encodeURIComponent(query)}`, {
                        headers: this.config.apiHeaders || {}
                    });
                    return await response.json();
                } catch (e) {
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
                const processedForRemote = this.engines.prepro.process(query);
                const contextState = this.engines.context.getState();
                const intent = mergedResults.intent || 'fuzzy';

                const ranked = mergedResults.results.map((item: AssistantDataItem) => {
                    const { score, breakdown } = this.engines.scoring.calculate(item, processedForRemote, 0.5, intent, contextState);
                    return {
                        item: { ...item, scoreBreakdown: breakdown },
                        score
                    };
                }).sort((a: any, b: any) => b.score - a.score);

                return {
                    ...mergedResults,
                    results: ranked.map((r: any) => r.item).slice(0, limit),
                    confidence: Math.min(Math.round(ranked[0].score * 2), 100),
                    sentiment: {
                        score: sentiment.score,
                        label: sentiment.label,
                        isUrgent: sentiment.isUrgent,
                        intensity: sentiment.intensity
                    },
                    scoreBreakdown: ranked.length > 0 ? ranked[0].item.scoreBreakdown : undefined
                };
            }
        } catch (error) {
            console.error("Remote search failed:", error);
        }
        return null;
    }

    public async searchWithComparison(query: string): Promise<AssistantResult & { comparison?: ComparisonResult }> {
        const base = await this.search(query);
        if (this.isComparisonQuery(query)) {
            const comparison = await this.compareProducts(query);
            const labels = this.getComparisonLabels();
            let answer = comparison.recommendation
                ? `${labels.recommendation!}: **${comparison.recommendation.item.title}**\n\n${comparison.tableMarkdown}`
                : labels.noProducts!;
            return { ...base, intent: 'comparison', answer, comparison };
        }
        return base;
    }

    public isComparisonQuery(query: string): boolean {
        const triggers = this.config.comparisonTriggers || ["bandingkan", "vs", "lawan", "bedanya", "lebih bagus mana"];
        return triggers.some(t => query.toLowerCase().includes(t.toLowerCase()));
    }

    public async compareProducts(query: string, category?: string, maxItems: number = 4): Promise<ComparisonResult> {
        let candidates = category
            ? this.searchData.filter(i => i.category.toLowerCase().includes(category.toLowerCase()))
            : (await this.search(query)).results;

        candidates = candidates.slice(0, maxItems);
        const items = candidates.map(item => {
            const attrs = this.engines.prepro.extractAttributes(item);
            return {
                title: item.title,
                attributes: attrs,
                score: this.engines.scoring.calculateComparisonScore(item, attrs),
                isRecommended: item.is_recommended || false,
                url: item.url,
                price: item.price_numeric,
                salePrice: item.sale_price
            };
        }).sort((a: any, b: any) => b.score - a.score);

        const allAttrs = new Set<string>();
        items.forEach(i => Object.keys(i.attributes).forEach(a => allAttrs.add(a)));
        const labels = Array.from(allAttrs);

        return {
            items,
            attributeLabels: labels,
            recommendation: items.length > 0 ? { item: items[0], reasons: this.generateReasons(items[0], items) } : null,
            tableHtml: "",
            tableMarkdown: this.generateTableMarkdown(items, labels)
        };
    }

    private getComparisonLabels() {
        return { ...DEFAULT_COMPARISON_LABELS, ...(this.config.comparisonLabels || {}) };
    }

    private generateReasons(item: any, allItems: any[]): string[] {
        const reasons: string[] = [];
        const labels = this.getComparisonLabels();
        if (item.salePrice && item.price) {
            const discount = Math.round(((item.price - item.salePrice) / item.price) * 100);
            reasons.push(labels.discount!.replace('{discount}', discount.toString()));
        }
        const prices = allItems.filter(i => i.price || i.salePrice).map(i => i.salePrice || i.price || Infinity);
        if ((item.salePrice || item.price || Infinity) === Math.min(...prices) && prices.length > 1) {
            reasons.push(labels.cheapest!);
        }
        return reasons;
    }

    private generateTableMarkdown(items: any[], attributeLabels: string[]): string {
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
}

export default QueryOrchestrator;
