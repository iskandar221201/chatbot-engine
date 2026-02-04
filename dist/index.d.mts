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
    resultLimit?: number;
    subSearchJoiner?: string;
    uiTemplates?: {
        renderUserMessage?: (text: string) => string;
        renderAssistantContainer?: (contentHTML: string, result: AssistantResult) => string;
        renderResultCard?: (item: AssistantDataItem, index: number, isPrimary: boolean) => string;
        renderComparison?: (comparison: ComparisonResult) => string;
    };
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

declare class AssistantEngine {
    private searchData;
    private Fuse;
    private fuse;
    private config;
    private history;
    private stemmer;
    private tokenizer;
    constructor(searchData: AssistantDataItem[], FuseClass?: any, config?: AssistantConfig);
    private initFuse;
    private autoCorrect;
    private preprocess;
    private extractEntities;
    search(query: string): Promise<AssistantResult>;
    private executeSubSearch;
    private calculateDiceCoefficient;
    private stemIndonesian;
    private calculateScore;
    private detectIntent;
    /**
     * Get comparison triggers from config
     */
    private getComparisonTriggers;
    /**
     * Get labels for comparison output from config
     */
    private getComparisonLabels;
    /**
     * Check if query is a comparison request
     */
    isComparisonQuery(query: string): boolean;
    /**
     * Extract attributes from a product's description or extra data
     */
    private extractAttributes;
    /**
     * Calculate a comparison suitability score
     */
    private calculateComparisonScore;
    /**
     * Generate recommendation reasons
     */
    private generateReasons;
    /**
     * Generate Table HTML
     */
    private generateTableHtml;
    /**
     * Generate Table Markdown
     */
    private generateTableMarkdown;
    /**
     * Format attribute label for display
     */
    private formatAttributeLabel;
    /**
     * Main comparison method - compares products based on query or category
     */
    compareProducts(query: string, category?: string, maxItems?: number): Promise<ComparisonResult>;
    /**
     * Enhanced search that auto-detects comparison intent
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
    constructor(searchData: AssistantDataItem[], FuseClass?: any, selectors?: UISelectors, config?: AssistantConfig);
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

export { type AssistantConfig, AssistantController, type AssistantDataItem, AssistantEngine, type AssistantResult, type ComparisonItem, type ComparisonResult, type IntentRule, type UISelectors };
