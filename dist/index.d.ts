interface NLPConfig {
    useClassifier?: boolean;
    classifierThreshold?: number;
    trainingData?: Record<string, string[]>;
}

/**
 * Indonesian Sentiment Analyzer
 * Simple rule-based sentiment analysis for Indonesian text
 */
interface SentimentResult {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    isUrgent: boolean;
    intensity: 'low' | 'medium' | 'high';
    details: {
        positiveWords: string[];
        negativeWords: string[];
        intensifiers: string[];
    };
}
interface SentimentConfig {
    positiveWords?: Record<string, number>;
    negativeWords?: Record<string, number>;
    intensifiers?: Record<string, number>;
    negators?: string[];
    urgencyWords?: string[];
}
declare class SentimentAnalyzer {
    private config;
    private static defaultInstance;
    constructor(config?: SentimentConfig);
    /**
     * Analyze sentiment of Indonesian text
     */
    analyze(text: string): SentimentResult;
    static analyze(text: string): SentimentResult;
    static isNegative(text: string): boolean;
    static isPositive(text: string): boolean;
    static isUrgent(text: string): boolean;
    static getPriority(text: string): number;
    static getEmptyResult(): SentimentResult;
}

/**
 * Analytics & Telemetry System
 * Enterprise-grade event tracking and hooks
 */
type AnalyticsEventType = 'search' | 'lead_captured' | 'no_result' | 'error' | 'feedback' | 'sales_conversion' | 'performance';
interface AnalyticsEvent {
    type: AnalyticsEventType;
    payload: any;
    timestamp: number;
    sessionId?: string;
    metadata?: Record<string, any>;
}
type AnalyticsHandler = (event: AnalyticsEvent) => void;
interface AnalyticsConfig {
    enabled?: boolean;
    logger?: (message: string, level: 'info' | 'warn' | 'error') => void;
    sampleRate?: number;
}
declare class AnalyticsEngine {
    private handlers;
    private config;
    private metrics;
    constructor(config?: AnalyticsConfig);
    /**
     * Subscribe to analytics events
     * Useful for hooking into Google Analytics, Mixpanel, Datadog, etc.
     */
    onEvent(handler: AnalyticsHandler): () => void;
    /**
     * Track an event
     */
    track(type: AnalyticsEventType, payload: any, sessionId?: string, metadata?: Record<string, any>): void;
    /**
     * Get aggregated internal metrics
     */
    getMetrics(): Record<string, number>;
    /**
     * Reset internal metrics
     */
    resetMetrics(): void;
    private updateInternalMetrics;
}

/**
 * Sales Performance Reporter
 * Aggregates analytics data into actionable sales reports.
 */

interface SalesReportConfig {
    currencySymbol?: string;
    avgOrderValue?: number;
    leadConversionRate?: number;
    intentMap?: {
        lead?: string;
        price?: string;
        order?: string;
    };
}

/**
 * Hybrid LLM Connector
 * Connects the local sales engine to large language models for fallback responses.
 */
interface LLMProvider {
    name: string;
    generateResponse(prompt: string, context?: any): Promise<string>;
}
interface LLMConfig {
    provider?: LLMProvider;
    apiKey?: string;
    apiUrl?: string;
    model?: string;
    systemPrompt?: string;
}
declare class HybridAI {
    private provider;
    private systemPrompt;
    constructor(config?: LLMConfig);
    fallback(query: string, context?: any): Promise<string | null>;
    setProvider(provider: LLMProvider): void;
}

/**
 * Sales Psychology Engine
 * Triggers psychological buying signals: Cross-sell, FOMO, Social Proof
 */

interface CrossSellRule {
    triggerCategory: string;
    suggestCategory: string;
    messageTemplate: string;
}
interface SalesPsychologyConfig {
    enableFomo?: boolean;
    enableSocialProof?: boolean;
    enableCrossSell?: boolean;
    fomoThreshold?: number;
    crossSellRules?: CrossSellRule[];
}
declare class SalesPsychology {
    private config;
    constructor(config?: SalesPsychologyConfig);
    /**
     * Generate FOMO text for a specific item
     */
    getFomoSignal(item: AssistantDataItem): string | null;
    /**
     * Generate Social Proof text
     */
    getSocialProof(item: AssistantDataItem): string | null;
    /**
     * Get Cross-Sell suggestions based on current item
     */
    getCrossSell(currentItem: AssistantDataItem, allItems: AssistantDataItem[]): AssistantDataItem[];
    /**
     * Get persuasive call-to-action message
     */
    getPersuasiveCTA(grade: 'hot' | 'warm' | 'cold'): string;
    /**
     * Get a random closing question to nudge the user toward a purchase
     */
    getClosingQuestion(): string;
    /**
     * Get a sympathetic prefix for objection handling
     */
    getObjectionPrefix(): string;
}

interface AssistantDataItem {
    title: string;
    description: string;
    answer?: string;
    url: string;
    category: string;
    keywords: string[];
    price_numeric?: number;
    sale_price?: number;
    badge_text?: string;
    cta_label?: string;
    cta_url?: string;
    image_url?: string;
    is_recommended?: boolean;
    attributes?: Record<string, string>;
    scoreBreakdown?: Record<string, number>;
    [key: string]: any;
}
interface DiagnosticEvent$1 {
    id: string;
    timestamp: number;
    duration?: number;
    meta?: Record<string, any>;
}
interface AssistantResult {
    results: AssistantDataItem[];
    intent: string;
    entities: Record<string, boolean>;
    confidence: number;
    answer?: string;
    sentiment?: {
        score: number;
        label: 'positive' | 'negative' | 'neutral';
        isUrgent: boolean;
        intensity: 'low' | 'medium' | 'high';
    };
    scoreBreakdown?: Record<string, number>;
    diagnostics?: DiagnosticEvent$1[];
}
interface ComparisonItem {
    title: string;
    attributes: Record<string, string | number | boolean>;
    score: number;
    isRecommended: boolean;
    url: string;
    price?: number;
    salePrice?: number;
}
interface ComparisonResult {
    items: ComparisonItem[];
    attributeLabels: string[];
    recommendation: {
        item: ComparisonItem;
        reasons: string[];
    } | null;
    tableHtml: string;
    tableMarkdown: string;
}
interface AssistantConfig {
    phoneticMap?: Record<string, string[]>;
    semanticMap?: Record<string, string[]>;
    stopWords?: string[];
    entityDefinitions?: Record<string, string[]>;
    intentRules?: IntentRule[];
    whatsappNumber?: string;
    stemmingSuffixes?: string[];
    salesTriggers?: Record<string, string[]>;
    conversationTriggers?: Record<string, string[]>;
    contactTriggers?: string[];
    fallbackIntentResponses?: Record<string, string>;
    searchMode?: 'local' | 'remote';
    apiUrl?: string | string[];
    apiHeaders?: Record<string, string>;
    autoCrawl?: boolean;
    crawlMaxDepth?: number;
    crawlMaxPages?: number;
    crawlIgnorePatterns?: (string | RegExp)[];
    crawlerCategory?: string;
    crawlerKeywords?: string[];
    comparisonTriggers?: string[];
    comparisonLabels?: {
        title?: string;
        price?: string;
        recommendation?: string;
        bestChoice?: string;
        reasons?: string;
        noProducts?: string;
        vsLabel?: string;
        discount?: string;
        cheapest?: string;
        mostFeatures?: string;
        warranty?: string;
        teamRecommendation?: string;
    };
    attributeExtractors?: Record<string, RegExp | string>;
    featurePatterns?: (RegExp | string)[];
    attributeLabels?: Record<string, string>;
    schema?: Record<string, string>;
    conjunctions?: string[] | RegExp;
    locale?: string;
    currencySymbol?: string;
    answerTemplates?: {
        price?: string | string[];
        features?: string | string[];
        noResults?: string | string[];
    };
    sentimentPrefixes?: {
        negative?: string[];
        positive?: string[];
    };
    referenceTriggers?: string[];
    security?: any;
    resultLimit?: number;
    subSearchJoiner?: string;
    debugMode?: boolean;
    uiTemplates?: {
        renderUserMessage?: (text: string) => string;
        renderAssistantContainer?: (contentHTML: string, result: AssistantResult) => string;
        renderResultCard?: (item: AssistantDataItem, index: number, isPrimary: boolean) => string;
        renderComparison?: (comparison: ComparisonResult) => string;
    };
    salesPsychology?: SalesPsychologyConfig;
    hybridAI?: LLMConfig;
    analytics?: AnalyticsConfig;
    salesReporter?: SalesReportConfig;
    sentiment?: SentimentConfig;
    nlp?: NLPConfig;
}
interface IntentRule {
    intent: string;
    conditions: {
        entities?: string[];
        tokens?: string[];
        categories?: string[];
    };
}
interface UISelectors {
    overlayId: string;
    inputId: string;
    sendBtnId: string;
    closeBtnId: string;
    chatContainerId: string;
    messagesListId: string;
    typingIndicatorId: string;
    quickLinksClass: string;
    welcomeMsgClass: string;
}

/**
 * Middleware Pipeline
 * Interceptor pattern for extreme extensibility.
 * Inspired by Axios interceptors and Express middleware.
 */

interface MiddlewareContext {
    query: string;
    originalQuery: string;
    context?: Record<string, any>;
    metadata?: Record<string, any>;
    stop: boolean;
}
type RequestMiddleware = (ctx: MiddlewareContext, next: () => Promise<void>) => Promise<void> | void;
type ResponseMiddleware = (result: AssistantResult, ctx: MiddlewareContext, next: () => Promise<void>) => Promise<void> | void;
declare class MiddlewareManager {
    private requestMiddlewares;
    private responseMiddlewares;
    /**
     * Add a middleware to intercept and modify the REQUEST before processing
     */
    useRequest(middleware: RequestMiddleware): void;
    /**
     * Add a middleware to intercept and modify the RESPONSE before returning
     */
    useResponse(middleware: ResponseMiddleware): void;
    /**
     * Execute Request Pipeline
     */
    executeRequest(query: string, context?: Record<string, any>): Promise<MiddlewareContext>;
    /**
     * Execute Response Pipeline
     */
    executeResponse(result: AssistantResult, ctx: MiddlewareContext): Promise<AssistantResult>;
}

/**
 * Intent Orchestrator Sub-Engine
 * Coordinates NLP classification, rule-based triggers, and fuzzy matching.
 */

interface IntentOrchestratorConfig {
    nlp?: NLPConfig;
    salesTriggers?: Record<string, string[]>;
    conversationTriggers?: Record<string, string[]>;
    contactTriggers?: string[];
    threshold?: number;
}
declare class IntentOrchestrator {
    private nlp;
    private config;
    constructor(config?: IntentOrchestratorConfig);
    /**
     * Detect intent from a query and its processed tokens
     */
    detect(query: string, tokens: string[], stemmedTokens: string[]): string;
    /**
     * Add training data to NLP classifier
     */
    train(text: string, label: string): void;
}

/**
 * Context Engine Sub-Engine
 * Manages conversation state, history, and anaphora resolution.
 */

interface ContextConfig {
    referenceTriggers?: string[];
    ttl?: number;
    maxInteractions?: number;
}
interface ContextState {
    lastCategory: string | null;
    lastItemId: string | null;
    detectedEntities: Set<string>;
    interactionCount: number;
    lockedEntityId: string | null;
}
interface ContextState {
    lastCategory: string | null;
    lastItemId: string | null;
    detectedEntities: Set<string>;
    interactionCount: number;
    lockedEntityId: string | null;
    lastActive: number;
}
declare class ContextEngine {
    private state;
    private config;
    constructor(config?: ContextConfig | string[]);
    /**
     * Resolve anaphora (references to previous subjects) in a query
     */
    resolveAnaphora(query: string): string;
    /**
     * Update state based on the latest result
     */
    update(result: AssistantResult): void;
    /**
     * Prune stale state based on TTL
     */
    private prune;
    /**
     * Get the current state summary
     */
    getState(): Readonly<ContextState>;
    /**
     * Clear context
     */
    reset(): void;
}

/**
 * Response Engine Sub-Engine
 * Handles response formatting, template replacement, and adaptive tuning.
 */

interface ResponseEngineConfig {
    answerTemplates?: AssistantConfig['answerTemplates'];
    sentimentPrefixes?: AssistantConfig['sentimentPrefixes'];
    fallbackIntentResponses?: AssistantConfig['fallbackIntentResponses'];
    locale?: string;
    currencySymbol?: string;
    schema?: AssistantConfig['schema'];
}
declare class ResponseEngine {
    private config;
    private salesPsychology;
    constructor(config: ResponseEngineConfig | undefined, salesPsychology: SalesPsychology);
    /**
     * Compose the final answer string based on the result and context
     */
    /**
     * Compose the final answer string based on the result and context
     */
    compose(result: AssistantResult, intent: string, isConversational: boolean, extractAttributes: (item: AssistantDataItem) => Record<string, string>): string;
    private getTemplate;
    private isNoResult;
    /**
     * Dynamically assemble a natural description sentence from data items
     */
    private assembleDescription;
}

/**
 * Language Provider System
 * Abstracting linguistic logic (Normalization, Stemming, Stopwords) per language.
 *
 * OPTIMIZATION: Sastrawi (305KB) is lazy-loaded only when Indonesian stemming is used.
 */
interface ILanguageProvider {
    locale: string;
    normalize(text: string): string;
    stem(word: string): string;
    getStopWords(): string[];
    /** Optional: Check if stemmer is ready (for async initialization) */
    isReady?: () => boolean;
    /** Optional: Initialize stemmer async */
    init?: () => Promise<void>;
}

interface PreprocessingConfig {
    languageProvider?: ILanguageProvider;
    phoneticMap?: Record<string, string[]>;
    stopWords?: string[];
    semanticMap?: Record<string, string[]>;
    entityDefinitions?: Record<string, string[]>;
    attributeExtractors?: Record<string, RegExp>;
    crawlerCategory?: string;
}
interface ProcessedQuery {
    tokens: string[];
    expanded: string[];
    entities: Record<string, boolean>;
    signals: {
        isQuestion: boolean;
        isUrgent: boolean;
    };
}
declare class PreprocessingEngine {
    private provider;
    private config;
    private stemCache;
    constructor(config?: PreprocessingConfig);
    /**
     * Correct common typos using phonetic/pattern matching
     */
    autoCorrect(word: string): string;
    /**
     * Memoized Indonesian Stemming
     */
    stem(word: string): string;
    /**
     * Main preprocessing pipeline
     */
    process(query: string): ProcessedQuery;
    /**
     * Extract entities based on keywords
     */
    extractEntities(tokens: string[]): Record<string, boolean>;
    /**
     * Extract attributes from raw text (Description/Content)
     */
    extractAttributes(item: AssistantDataItem): Record<string, string>;
}

/**
 * Scoring Engine Sub-Engine
 * Handles ranking, relevancy calculations, and weight-based scoring.
 */

interface ScoringConfig {
    crawlerCategory?: string;
}
declare class ScoringEngine {
    private config;
    constructor(config?: ScoringConfig);
    /**
     * Main scoring function for a single item
     * Enhanced with better relevance differentiation
     */
    calculate(item: AssistantDataItem, processed: any, fuseScore: number, intent: string, contextState: any): {
        score: number;
        breakdown: Record<string, number>;
    };
    /**
     * Calculate similarity between two strings using bigrams
     */
    calculateDiceCoefficient(s1: string, s2: string): number;
    /**
     * Scoring for product comparisons
     */
    calculateComparisonScore(item: AssistantDataItem, attributes: Record<string, string>): number;
}

/**
 * Diagnostic Tracer
 * Deep observability for the search pipeline.
 * Captures timings, internal counts, and logic branches.
 */
interface DiagnosticEvent {
    id: string;
    timestamp: number;
    duration?: number;
    meta?: Record<string, any>;
}
declare class DiagnosticTracer {
    private events;
    private startTime;
    private activePoints;
    constructor();
    /**
     * Start a timed operation point
     */
    start(id: string): void;
    /**
     * Stop a timed operation point and record it
     */
    stop(id: string, meta?: Record<string, any>): void;
    /**
     * Record a simple point event
     */
    record(id: string, meta?: Record<string, any>): void;
    /**
     * Get all recorded events
     */
    getEvents(): DiagnosticEvent[];
    /**
     * Reset the tracer
     */
    reset(): void;
}

/**
 * Query Orchestrator Sub-Engine
 * Coordinates the search pipeline: Preprocessing -> Intent -> Search -> Scoring -> Response.
 * Handles compound queries, conjunctions, and remote/local coordination.
 */

declare class QueryOrchestrator {
    private engines;
    private config;
    private searchData;
    private fuse;
    constructor(engines: any, searchData: AssistantDataItem[], fuse: any, config: AssistantConfig);
    /**
     * Main Search Entry Point
     */
    search(originalQuery: string): Promise<AssistantResult>;
    /**
     * Internal Search Coordinator
     */
    executeSubSearch(query: string, tracer: DiagnosticTracer): Promise<AssistantResult>;
    private handleRemoteSearch;
    searchWithComparison(query: string): Promise<AssistantResult & {
        comparison?: ComparisonResult;
    }>;
    isComparisonQuery(query: string): boolean;
    compareProducts(query: string, category?: string, maxItems?: number): Promise<ComparisonResult>;
    private getComparisonLabels;
    private generateReasons;
    private generateTableMarkdown;
    private formatAttributeLabel;
}

/**
 * Security Guard
 * Input sanitization and validation for server-side safety
 */
interface SecurityConfig {
    maxLength?: number;
    blockScripts?: boolean;
    blockSqlInjectionPatterns?: boolean;
    allowedTags?: string[];
    strictMode?: boolean;
}
interface SecurityCheckResult {
    isValid: boolean;
    sanitized: string;
    threats: string[];
    original: string;
}
declare class SecurityGuard {
    private config;
    constructor(config?: SecurityConfig);
    /**
     * Sanitize and validate input
     */
    process(input: string): SecurityCheckResult;
    /**
     * Quick sanitize helper
     */
    static clean(input: string): string;
    /**
     * Check if input is safe
     */
    static isSafe(input: string): boolean;
}

declare class AssistantEngine {
    private searchData;
    private Fuse;
    private fuse;
    private config;
    private _languageProvider;
    analytics: AnalyticsEngine;
    middleware: MiddlewareManager;
    salesPsychology: SalesPsychology;
    hybridAI: HybridAI;
    intentOrchestrator: IntentOrchestrator;
    sentimentAnalyzer: SentimentAnalyzer;
    securityGuard: SecurityGuard;
    context: ContextEngine;
    responseEngine: ResponseEngine;
    prepro: PreprocessingEngine;
    scoring: ScoringEngine;
    orchestrator: QueryOrchestrator;
    constructor(searchData: AssistantDataItem[], FuseClass?: any, config?: AssistantConfig);
    addData(data: AssistantDataItem[]): void;
    private initFuse;
    /**
     * Initialize async resources (language stemmer, etc.)
     * Call this once at startup for optimal first-search performance.
     * Not required - resources load on-demand if not initialized.
     */
    init(): Promise<void>;
    /**
     * Check if async resources are ready
     */
    isReady(): boolean;
    /**
     * Primary Search API
     */
    search(query: string): Promise<AssistantResult>;
    /**
     * Comparison API
     */
    isComparisonQuery(query: string): boolean;
    compareProducts(query: string, category?: string, maxItems?: number): Promise<ComparisonResult>;
    /**
     * Hybrid Search + Comparison API
     */
    searchWithComparison(query: string): Promise<AssistantResult & {
        comparison?: ComparisonResult;
    }>;
}

declare class AssistantController {
    private engine;
    private selectors;
    private config;
    private elements;
    private chatHistory;
    private interactionCount;
    private devModeUI;
    constructor(searchData: AssistantDataItem[], FuseClass?: any, selectors?: UISelectors, config?: AssistantConfig);
    private initCrawler;
    private initElements;
    private initEventListeners;
    openAssistant(): void;
    closeAssistant(): void;
    private performAction;
    private showTyping;
    private hideTyping;
    private scrollToBottom;
    private addUserMessage;
    private addAssistantMessage;
    private generateResponseHTML;
    private formatText;
    private formatCurrency;
    private saveHistory;
    private loadHistory;
}

interface CrawlerConfig {
    maxDepth?: number;
    maxPages?: number;
    ignorePatterns?: (string | RegExp)[];
    autoCrawl?: boolean;
    category?: string;
    onProgress?: (progress: {
        url: string;
        totalIndexed: number;
        status: string;
    }) => void;
    /** Elements to exclude from indexing (e.g., 'button, nav, footer') */
    excludeSelectors?: string;
    /** If specified, only content within these selectors will be indexed */
    contentSelectors?: string;
}
declare class SiteCrawler {
    private baseUrl;
    private visited;
    private data;
    private config;
    constructor(baseUrl?: string, config?: CrawlerConfig);
    /**
     * Start crawling from a specific path or the current location
     */
    markAsVisited(url: string): void;
    crawlAll(startPath?: string): Promise<AssistantDataItem[]>;
    private shouldIgnore;
    processDocument(doc: Document, url: string, category?: string): AssistantDataItem;
    private processPage;
    private extractMainContent;
    private extractKeywords;
}

export { type AssistantConfig, AssistantController, type AssistantDataItem, AssistantEngine, type AssistantResult, type ComparisonItem, type ComparisonResult, type DiagnosticEvent$1 as DiagnosticEvent, type IntentRule, SiteCrawler, type UISelectors };
