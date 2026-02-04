export interface SearchDataItem {
    title: string;
    description: string;
    category: string;
    keywords?: string[];
    [key: string]: any;
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
    lastItemContext: string | null;
    userPreferences: Record<string, any>;
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
    patterns: string[];
    boost?: number;
}
export interface BoostingRule {
    name?: string;
    condition: (item: SearchDataItem, context: SearchContext, intent: string) => boolean;
    score: number;
}
export interface AIConfig {
    synonyms?: Record<string, string[] | string>;
    stopWords?: string[];
    intents?: IntentDefinition[];
    boostingRules?: BoostingRule[];
    weights?: {
        title?: number;
        keywords?: number;
        description?: number;
    };
    stemmingSuffixes?: string[];
}
