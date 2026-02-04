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
    };
    attributeExtractors?: Record<string, RegExp | string>;
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
