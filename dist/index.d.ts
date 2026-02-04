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
    fallbackIntentResponses?: Record<string, string>;
    searchMode?: 'local' | 'remote';
    apiUrl?: string | string[];
    apiHeaders?: Record<string, string>;
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
    constructor(searchData: AssistantDataItem[], FuseClass?: any, config?: AssistantConfig);
    private initFuse;
    private autoCorrect;
    private preprocess;
    private extractEntities;
    search(query: string): Promise<AssistantResult>;
    private calculateDiceCoefficient;
    private stemIndonesian;
    private calculateScore;
    private detectIntent;
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
    private saveHistory;
    private loadHistory;
}

export { type AssistantConfig, AssistantController, type AssistantDataItem, AssistantEngine, type AssistantResult, type IntentRule, type UISelectors };
