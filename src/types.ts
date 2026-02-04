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
    searchMode?: 'local' | 'remote';
    apiUrl?: string | string[];
    apiHeaders?: Record<string, string>;
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
