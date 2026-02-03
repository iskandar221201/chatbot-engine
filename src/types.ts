export interface SearchDataItem {
    title: string;
    description: string;
    category: string;
    keywords?: string[];
    [key: string]: any; // Allow custom properties
}

export interface SearchResult {
    results: SearchDataItem[];
    intent: string;
    confidence: number;
    context: SearchContext;
    stats: SearchStats;
}

export interface SearchContext {
    history: ConversationTurn[];
    lastTopic: string | null;
    lastItemContext: string | null; // Generic "Item" instead of "Package"
    userPreferences: Record<string, any>; // Generic preferences
}

export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    intent?: string;
}

export interface SearchStats {
    totalQueries: number;
    intentCounts: Record<string, number>;
}

export interface IntentDefinition {
    name: string;
    patterns: string[]; // Keywords or phrases
    boost?: number;
}

export interface BoostingRule {
    name?: string;
    condition: (item: SearchDataItem, context: SearchContext, intent: string) => boolean;
    score: number;
}

export interface AIConfig {
    synonyms?: Record<string, string[] | string>; // Support simple map and array map
    stopWords?: string[];
    intents?: IntentDefinition[];
    boostingRules?: BoostingRule[];
    weights?: {
        title?: number;
        keywords?: number;
        description?: number;
    };
}
