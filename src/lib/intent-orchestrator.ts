/**
 * Intent Orchestrator Sub-Engine
 * Coordinates NLP classification, rule-based triggers, and fuzzy matching.
 */

import { NLPClassifier, NLPConfig } from './nlp-classifier';
import {
    DEFAULT_SALES_TRIGGERS,
    DEFAULT_CHAT_TRIGGERS,
    DEFAULT_CONTACT_TRIGGERS
} from '../defaults';

export interface IntentOrchestratorConfig {
    nlp?: NLPConfig;
    salesTriggers?: Record<string, string[]>;
    conversationTriggers?: Record<string, string[]>;
    contactTriggers?: string[];
    threshold?: number;
}

export class IntentOrchestrator {
    private nlp: NLPClassifier;
    private config: IntentOrchestratorConfig;

    constructor(config: IntentOrchestratorConfig = {}) {
        this.config = config;
        this.nlp = new NLPClassifier(config.nlp || {});
    }

    /**
     * Detect intent from a query and its processed tokens
     */
    public detect(query: string, tokens: string[], stemmedTokens: string[]): string {
        // 1. High-Confidence AI Classification
        const aiIntent = this.nlp.classify(query);
        if (aiIntent && aiIntent.confidence > (this.config.threshold || 0.7)) {
            return aiIntent.intent;
        }

        // 2. Rule-Based Triggers

        // A. Contact Triggers
        const contactTriggers = [
            ...DEFAULT_CONTACT_TRIGGERS,
            ...(this.config.contactTriggers || [])
        ];
        if (contactTriggers.some(t => stemmedTokens.includes(t) || tokens.includes(t))) {
            return 'chat_contact';
        }

        // B. Chat/Conversation Triggers
        const chats = {
            ...DEFAULT_CHAT_TRIGGERS,
            ...(this.config.conversationTriggers || {})
        };
        for (const [intent, triggers] of Object.entries(chats)) {
            if (triggers.some(t => stemmedTokens.includes(t) || tokens.includes(t))) {
                return `chat_${intent}`;
            }
        }

        // C. Sales Triggers
        const sales = {
            ...DEFAULT_SALES_TRIGGERS,
            ...(this.config.salesTriggers || {})
        };
        for (const [intent, triggers] of Object.entries(sales)) {
            if (triggers.some(t => stemmedTokens.includes(t) || tokens.includes(t))) {
                return `sales_${intent}`;
            }
        }

        // 3. Low-Confidence NLP Fallback
        if (aiIntent && aiIntent.confidence > 0.6) {
            return aiIntent.intent;
        }

        return 'fuzzy';
    }

    /**
     * Add training data to NLP classifier
     */
    public train(text: string, label: string) {
        this.nlp.train(text, label);
    }
}

export default IntentOrchestrator;
