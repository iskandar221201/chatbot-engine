/**
 * Response Engine Sub-Engine
 * Handles response formatting, template replacement, and adaptive tuning.
 */

import { AssistantDataItem, AssistantResult, AssistantConfig } from '../types';
import { DEFAULT_UI_CONFIG, DEFAULT_SCHEMA } from '../defaults';
import { formatCurrency } from '../utils';
import { SalesPsychology } from './sales-psychology';

export interface ResponseEngineConfig {
    answerTemplates?: AssistantConfig['answerTemplates'];
    sentimentPrefixes?: AssistantConfig['sentimentPrefixes'];
    fallbackIntentResponses?: AssistantConfig['fallbackIntentResponses'];
    locale?: string;
    currencySymbol?: string;
    schema?: AssistantConfig['schema'];
}

export class ResponseEngine {
    private config: ResponseEngineConfig;
    private salesPsychology: SalesPsychology;

    constructor(
        config: ResponseEngineConfig = {},
        salesPsychology: SalesPsychology
    ) {
        this.config = config;
        this.salesPsychology = salesPsychology;
    }

    /**
     * Compose the final answer string based on the result and context
     */
    public compose(
        result: AssistantResult,
        intent: string,
        isConversational: boolean,
        extractAttributes: (item: AssistantDataItem) => Record<string, string>
    ): string {
        const topMatches = result.results;
        const templates = { ...DEFAULT_UI_CONFIG.answerTemplates, ...this.config.answerTemplates };
        const sentiment = result.sentiment;

        let answer = topMatches[0]?.answer || "";

        // 1. Template-based Answer Generation
        if (topMatches.length > 0) {
            const topItem = topMatches[0];
            const attributes = extractAttributes(topItem);

            if (intent === 'sales_harga') {
                const harga = topItem.sale_price || topItem.price_numeric;
                if (harga) {
                    answer = (templates.price || "")
                        .replace('{title}', topItem.title)
                        .replace('{currency}', '')
                        .replace('{price}', formatCurrency(
                            harga,
                            this.config.currencySymbol || DEFAULT_UI_CONFIG.currencySymbol!,
                            this.config.locale || DEFAULT_UI_CONFIG.locale!
                        ))
                        .replace('  ', ' ');
                }
            } else if (intent === 'sales_fitur' || intent === 'fuzzy_fitur') {
                const schema = { ...DEFAULT_SCHEMA, ...this.config.schema };
                const fitur = attributes[schema.FEATURES!] || topItem.description;
                answer = (templates.features || "").replace('{title}', topItem.title).replace('{features}', fitur);
            }
        }

        // 2. Fallback Responses
        if (!answer) {
            const fallback = { ...DEFAULT_UI_CONFIG.fallbackResponses, ...this.config.fallbackIntentResponses };
            if (intent === 'chat_greeting') answer = fallback['chat_greeting']!;
            else if (intent === 'chat_thanks') answer = fallback['chat_thanks']!;
            else if (intent === 'chat_contact') answer = fallback['chat_contact']!;
            else if (!isConversational && topMatches.length === 0) answer = templates.noResults!;
        }

        // 3. Adaptive Response Tuning (Tone & Psychology)
        if (answer && answer !== templates.noResults) {
            if (sentiment) {
                const prefixesConfig = { ...DEFAULT_UI_CONFIG.sentimentPrefixes, ...this.config.sentimentPrefixes };

                if (sentiment.label === 'negative') {
                    answer = `${this.salesPsychology.getObjectionPrefix()} ${answer}`;
                } else if (sentiment.label === 'positive' && sentiment.intensity === 'high') {
                    const prefixes = prefixesConfig.positive || [];
                    if (prefixes.length > 0) {
                        const randomEntry = prefixes[Math.floor(Math.random() * prefixes.length)];
                        answer = `${randomEntry}${answer}`;
                    }
                }
            }

            if (intent.startsWith('sales_')) {
                if (intent === 'sales_beli') {
                    answer += ` ${this.salesPsychology.getClosingQuestion()}`;
                } else if (topMatches.length > 0 && topMatches[0].is_recommended) {
                    answer += " Produk ini sangat direkomendasikan!";
                }
            }
        }

        return answer;
    }
}

export default ResponseEngine;
