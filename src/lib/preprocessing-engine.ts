/**
 * Preprocessing Engine Sub-Engine
 * Handles text normalization, phonetic correction, Indonesian linguistics, and semantic expansion.
 */

import { Stemmer, Tokenizer } from "./sastrawi";
import {
    DEFAULT_PHONETIC_MAP,
    DEFAULT_STOP_WORDS,
    DEFAULT_SEMANTIC_MAP,
    DEFAULT_ATTRIBUTE_EXTRACTORS
} from "../defaults";
import { AssistantDataItem, AssistantConfig } from "../types";

export interface PreprocessingConfig {
    phoneticMap?: Record<string, string[]>;
    stopWords?: string[];
    semanticMap?: Record<string, string[]>;
    entityDefinitions?: Record<string, string[]>;
    attributeExtractors?: Record<string, RegExp>;
    crawlerCategory?: string;
}

export interface ProcessedQuery {
    tokens: string[];
    expanded: string[];
    entities: Record<string, boolean>;
    signals: {
        isQuestion: boolean;
        isUrgent: boolean;
    };
}

export class PreprocessingEngine {
    private stemmer: Stemmer;
    private tokenizer: Tokenizer;
    private config: PreprocessingConfig;

    constructor(config: PreprocessingConfig = {}) {
        this.config = config;
        this.stemmer = new Stemmer();
        this.tokenizer = new Tokenizer();
    }

    /**
     * Correct common typos using phonetic/pattern matching
     */
    public autoCorrect(word: string): string {
        const phoneticMap = { ...DEFAULT_PHONETIC_MAP, ...(this.config.phoneticMap || {}) };
        for (const [correct, typos] of Object.entries(phoneticMap)) {
            if (typos.includes(word)) return correct;
        }
        return word;
    }

    /**
     * Main preprocessing pipeline
     */
    public process(query: string): ProcessedQuery {
        const signals = {
            isQuestion: query.includes('?'),
            isUrgent: query.includes('!'),
        };

        const stopWords = this.config.stopWords ? new Set(this.config.stopWords) : new Set(DEFAULT_STOP_WORDS);
        const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
        const rawWords = cleanQuery.split(/\s+/).filter(w => w.length > 1);

        // Auto-correction using config or defaults
        const phoneticMap = this.config.phoneticMap || DEFAULT_PHONETIC_MAP;
        let correctedWords = rawWords.map(w => {
            for (const [correct, typos] of Object.entries(phoneticMap)) {
                if (typos.includes(w)) return correct;
            }
            return w;
        });

        // Indonesian Stemming
        const stemmedWords = correctedWords.map(w => this.stemmer.stem(w));

        // Combine and Filter
        const allTokens = [...new Set([...correctedWords, ...stemmedWords])];
        const filteredWords = allTokens.filter(w => !stopWords.has(w));

        // Semantic Expansion (Synonyms)
        const expansion: string[] = [];
        const semanticMap = this.config.semanticMap || DEFAULT_SEMANTIC_MAP;

        filteredWords.forEach(w => {
            if (semanticMap[w]) expansion.push(...semanticMap[w]);
            const stem = this.stemmer.stem(w);
            if (stem !== w && semanticMap[stem]) expansion.push(...semanticMap[stem]);
        });

        return {
            tokens: filteredWords,
            expanded: [...new Set([...filteredWords, ...expansion])],
            entities: this.extractEntities(filteredWords),
            signals
        };
    }

    /**
     * Extract entities based on keywords
     */
    public extractEntities(tokens: string[]): Record<string, boolean> {
        const detected: Record<string, boolean> = {};
        if (this.config.entityDefinitions) {
            for (const [entityName, keywords] of Object.entries(this.config.entityDefinitions)) {
                detected[entityName] = tokens.some(t => keywords.includes(t));
            }
        }
        return detected;
    }

    /**
     * Extract attributes from raw text (Description/Content)
     */
    public extractAttributes(item: AssistantDataItem): Record<string, string> {
        const attributes: Record<string, string> = { ...item.attributes };
        const extractors = { ...DEFAULT_ATTRIBUTE_EXTRACTORS, ...(this.config.attributeExtractors || {}) };
        const content = item.content || item.description;

        for (const [attr, regex] of Object.entries(extractors)) {
            if (!attributes[attr]) {
                const match = content.match(regex);
                if (match) attributes[attr] = match[1];
            }
        }
        return attributes;
    }

    /**
     * Direct Indonesian stemming
     */
    public stem(word: string): string {
        return this.stemmer.stem(word);
    }
}

export default PreprocessingEngine;
