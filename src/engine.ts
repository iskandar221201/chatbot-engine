import Fuse from "./lib/fuse";
import type {
    AssistantDataItem,
    AssistantConfig,
    AssistantResult,
    ComparisonResult
} from "./types";
import {
    DEFAULT_REFERENCE_TRIGGERS
} from "./defaults";
// Enterprise Modules
import { AnalyticsEngine } from "./lib/analytics";
import { MiddlewareManager } from "./lib/middleware";
import { SalesPsychology } from "./lib/sales-psychology";
import { HybridAI } from "./lib/llm-connector";
import { IntentOrchestrator } from "./lib/intent-orchestrator";
import { SentimentAnalyzer } from "./lib/sentiment";
import { ContextEngine } from "./lib/context-engine";
import { ResponseEngine } from "./lib/response-engine";
import { PreprocessingEngine } from "./lib/preprocessing-engine";
import { ScoringEngine } from "./lib/scoring-engine";
import { QueryOrchestrator } from "./lib/query-orchestrator";
import { IndonesianProvider, EnglishProvider } from "./lib/language-providers";
// Security
import { SecurityGuard } from "./lib/security-guard";

export class AssistantEngine {
    private searchData: AssistantDataItem[];
    private Fuse: any;
    private fuse: any;
    private config: AssistantConfig;
    private _languageProvider: any;

    // Sub-Engines
    public analytics: AnalyticsEngine;
    public middleware: MiddlewareManager;
    public salesPsychology: SalesPsychology;
    public hybridAI: HybridAI;
    public intentOrchestrator: IntentOrchestrator;
    public sentimentAnalyzer: SentimentAnalyzer;
    public securityGuard: SecurityGuard;
    public context: ContextEngine;
    public responseEngine: ResponseEngine;
    public prepro: PreprocessingEngine;
    public scoring: ScoringEngine;
    public orchestrator: QueryOrchestrator;

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

        // 1. Initialize Independent Modules
        this.analytics = new AnalyticsEngine(this.config.analytics);
        this.middleware = new MiddlewareManager();
        this.salesPsychology = new SalesPsychology(this.config.salesPsychology);
        this.hybridAI = new HybridAI(this.config.hybridAI);
        this.sentimentAnalyzer = new SentimentAnalyzer(this.config.sentiment);
        this.securityGuard = new SecurityGuard(this.config.security);

        // 2. Initialize Sub-Engines
        this.context = new ContextEngine(this.config.referenceTriggers || DEFAULT_REFERENCE_TRIGGERS);
        this.intentOrchestrator = new IntentOrchestrator({
            nlp: this.config.nlp,
            salesTriggers: this.config.salesTriggers,
            conversationTriggers: this.config.conversationTriggers,
            contactTriggers: this.config.contactTriggers
        });
        this.responseEngine = new ResponseEngine({
            answerTemplates: this.config.answerTemplates,
            sentimentPrefixes: this.config.sentimentPrefixes,
            fallbackIntentResponses: this.config.fallbackIntentResponses,
            locale: this.config.locale,
            currencySymbol: this.config.currencySymbol,
            schema: this.config.schema
        }, this.salesPsychology);
        // Store provider reference for lazy init
        this._languageProvider = this.config.locale === 'en' ? new EnglishProvider() : new IndonesianProvider();
        this.prepro = new PreprocessingEngine({
            languageProvider: this._languageProvider,
            phoneticMap: this.config.phoneticMap,
            stopWords: this.config.stopWords,
            semanticMap: this.config.semanticMap,
            entityDefinitions: this.config.entityDefinitions,
            attributeExtractors: this.config.attributeExtractors as Record<string, RegExp>,
            crawlerCategory: this.config.crawlerCategory
        });
        this.scoring = new ScoringEngine({
            crawlerCategory: this.config.crawlerCategory
        });

        // 3. Initialize Orchestrator (Wires everything together)
        this.initFuse();

        this.orchestrator = new QueryOrchestrator(
            {
                prepro: this.prepro,
                intent: this.intentOrchestrator,
                scoring: this.scoring,
                context: this.context,
                response: this.responseEngine,
                security: this.securityGuard,
                analytics: this.analytics,
                middleware: this.middleware,
                salesPsychology: this.salesPsychology,
                sentiment: this.sentimentAnalyzer
            },
            this.searchData,
            this.fuse,
            this.config
        );
    }

    public addData(data: AssistantDataItem[]) {
        this.searchData = [...this.searchData, ...data];
        this.initFuse();
        // Update orchestrator fuse reference
        if (this.orchestrator) {
            (this.orchestrator as any).fuse = this.fuse;
            (this.orchestrator as any).searchData = this.searchData;
        }
    }

    private initFuse() {
        if (this.Fuse) {
            this.fuse = new this.Fuse(this.searchData, {
                keys: [
                    { name: "title", weight: 0.8 },
                    { name: "keywords", weight: 0.5 },
                    { name: "description", weight: 0.2 },
                    // OPTIMIZATION: Removed 'content' - too heavy for fuzzy search
                ],
                threshold: 0.45,
                includeScore: true,
                useExtendedSearch: true,
                ignoreLocation: true, // Faster for short queries
                minMatchCharLength: 2, // Skip single char matches
            });
        }
    }

    /**
     * Initialize async resources (language stemmer, etc.)
     * Call this once at startup for optimal first-search performance.
     * Not required - resources load on-demand if not initialized.
     */
    public async init(): Promise<void> {
        if (this._languageProvider?.init) {
            await this._languageProvider.init();
        }
    }

    /**
     * Check if async resources are ready
     */
    public isReady(): boolean {
        if (this._languageProvider?.isReady) {
            return this._languageProvider.isReady();
        }
        return true; // English provider is always ready
    }

    /**
     * Primary Search API
     */
    public async search(query: string): Promise<AssistantResult> {
        return this.orchestrator.search(query);
    }

    /**
     * Comparison API
     */
    public isComparisonQuery(query: string): boolean {
        return this.orchestrator.isComparisonQuery(query);
    }

    public async compareProducts(query: string, category?: string, maxItems?: number): Promise<ComparisonResult> {
        return this.orchestrator.compareProducts(query, category, maxItems);
    }

    /**
     * Hybrid Search + Comparison API
     */
    public async searchWithComparison(query: string): Promise<AssistantResult & { comparison?: ComparisonResult }> {
        return this.orchestrator.searchWithComparison(query);
    }
}
