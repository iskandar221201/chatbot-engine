interface ClassificationResult {
    intent: string;
    confidence: number;
    allScores: Record<string, number>;
}
interface NLPConfig {
    useClassifier?: boolean;
    classifierThreshold?: number;
    trainingData?: Record<string, string[]>;
}
declare class NLPClassifier {
    private wordCounts;
    private labelCounts;
    private vocab;
    private totalDocuments;
    private config;
    constructor(config?: NLPConfig);
    private trainData;
    /**
     * Train the classifier with a document
     */
    train(text: string, label: string): void;
    /**
     * Classify text into an intent
     */
    classify(text: string): ClassificationResult;
    private calculateLogProbability;
    private calculateConfidence;
    private tokenize;
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
    [key: string]: any;
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
        price?: string;
        features?: string;
        noResults?: string;
    };
    sentimentPrefixes?: {
        negative?: string[];
        positive?: string[];
    };
    referenceTriggers?: string[];
    security?: any;
    resultLimit?: number;
    subSearchJoiner?: string;
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
    private history;
    private stemmer;
    private tokenizer;
    analytics: AnalyticsEngine;
    middleware: MiddlewareManager;
    salesPsychology: SalesPsychology;
    hybridAI: HybridAI;
    nlpClassifier: NLPClassifier;
    sentimentAnalyzer: SentimentAnalyzer;
    securityGuard: SecurityGuard;
    constructor(searchData: AssistantDataItem[], FuseClass?: any, config?: AssistantConfig);
    addData(data: AssistantDataItem[]): void;
    private initFuse;
    private autoCorrect;
    private preprocess;
    private extractEntities;
    search(originalQuery: string): Promise<AssistantResult>;
    private executeSubSearch;
    private calculateDiceCoefficient;
    private stemIndonesian;
    private calculateScore;
    private detectIntent;
    private extractAttributes;
    private calculateComparisonScore;
    private isComparisonQuery;
    private getComparisonLabels;
    private generateReasons;
    private generateTableMarkdown;
    private formatAttributeLabel;
    compareProducts(query: string, category?: string, maxItems?: number): Promise<ComparisonResult>;
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
    crawlAll(startPath?: string): Promise<AssistantDataItem[]>;
    private shouldIgnore;
    processDocument(doc: Document, url: string, category?: string): AssistantDataItem;
    private processPage;
    private extractMainContent;
    private extractKeywords;
}

export { type AssistantConfig, AssistantController, type AssistantDataItem, AssistantEngine, type AssistantResult, type ComparisonItem, type ComparisonResult, type IntentRule, SiteCrawler, type UISelectors };
