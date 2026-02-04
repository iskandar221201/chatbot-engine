export interface AssistantDataItem {
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
    [key: string]: any; // Allow for custom extra data
}

export interface AssistantResult {
    results: AssistantDataItem[];
    intent: string;
    entities: Record<string, boolean>;
    confidence: number;
    answer?: string; // New: Direct response string
    sentiment?: {
        score: number;
        label: 'positive' | 'negative' | 'neutral';
        isUrgent: boolean;
        intensity: 'low' | 'medium' | 'high';
    };
}

// Comparison feature types
export interface ComparisonItem {
    title: string;
    attributes: Record<string, string | number | boolean>;
    score: number;
    isRecommended: boolean;
    url: string;
    price?: number;
    salePrice?: number;
}

export interface ComparisonResult {
    items: ComparisonItem[];
    attributeLabels: string[];
    recommendation: {
        item: ComparisonItem;
        reasons: string[];
    } | null;
    tableHtml: string;
    tableMarkdown: string;
}

export interface AssistantConfig {
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
    // Crawler configuration
    autoCrawl?: boolean;
    crawlMaxDepth?: number;
    crawlMaxPages?: number;
    crawlIgnorePatterns?: (string | RegExp)[];
    crawlerCategory?: string;
    crawlerKeywords?: string[];
    // Comparison configuration
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
    // UI & Localization
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
    // UI Templates for customization
    uiTemplates?: {
        renderUserMessage?: (text: string) => string;
        renderAssistantContainer?: (contentHTML: string, result: AssistantResult) => string;
        renderResultCard?: (item: AssistantDataItem, index: number, isPrimary: boolean) => string;
        renderComparison?: (comparison: ComparisonResult) => string;
    };
    // Enterprise Modules
    salesPsychology?: import('./lib/sales-psychology').SalesPsychologyConfig;
    hybridAI?: import('./lib/llm-connector').LLMConfig;
    analytics?: import('./lib/analytics').AnalyticsConfig;
    salesReporter?: import('./lib/sales-reporter').SalesReportConfig;
    sentiment?: import('./lib/sentiment').SentimentConfig;
    nlp?: import('./lib/nlp-classifier').NLPConfig;
}

export interface IntentRule {
    intent: string;
    conditions: {
        entities?: string[];
        tokens?: string[];
        categories?: string[];
    };
}

export interface UISelectors {
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
