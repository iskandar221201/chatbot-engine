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

        // 1. Template-based Answer Generation (Rule-Based & Variational)
        if (topMatches.length > 0) {
            const topItem = topMatches[0];
            const attributes = extractAttributes(topItem);

            if (intent === 'sales_harga') {
                const harga = topItem.sale_price || topItem.price_numeric;
                if (harga) {
                    const template = this.getTemplate(templates.price);
                    answer = template
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
                const template = this.getTemplate(templates.features);
                answer = template.replace('{title}', topItem.title).replace('{features}', fitur);
            } else if (!answer) {
                // --- Dynamic Sentence Assembly (Natural Response Fallback) ---
                // If no specific intent matched or no manual answer, assemble a natural description
                answer = this.assembleDescription(topItem, attributes);
            }
        }

        // 2. Fallback Responses
        if (!answer) {
            const fallback = { ...DEFAULT_UI_CONFIG.fallbackResponses, ...this.config.fallbackIntentResponses };
            if (intent === 'chat_greeting') answer = fallback['chat_greeting']!;
            else if (intent === 'chat_thanks') answer = fallback['chat_thanks']!;
            else if (intent === 'chat_contact') answer = fallback['chat_contact']!;
            else if (!isConversational && topMatches.length === 0) {
                answer = this.getTemplate(templates.noResults!);
            }
        }

        // 3. Adaptive Response Tuning (Tone & Psychology)
        if (answer && !this.isNoResult(answer)) {
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

    private getTemplate(template: string | string[] | undefined): string {
        if (!template) return "";
        if (Array.isArray(template)) {
            return template[Math.floor(Math.random() * template.length)];
        }
        return template;
    }

    private isNoResult(text: string): boolean {
        const defaults = DEFAULT_UI_CONFIG.answerTemplates.noResults;
        if (Array.isArray(defaults)) return defaults.includes(text);
        return text === defaults;
    }

    /**
     * Dynamically assemble a natural description sentence from data items
     */
    private assembleDescription(item: AssistantDataItem, attributes: Record<string, string>): string {
        // Example: "Samsung S23 adalah Smartphone canggih dengan harga Rp 15jt. Fitur andalannya adalah kamera 200MP."
        const currency = this.config.currencySymbol || DEFAULT_UI_CONFIG.currencySymbol!;
        const locale = this.config.locale || DEFAULT_UI_CONFIG.locale!;

        let sent = `**${item.title}**`;

        if (item.category) {
            sent += ` adalah ${item.category}`;
        }

        const price = item.sale_price || item.price_numeric;
        if (price) {
            sent += ` yang tersedia dengan harga ${formatCurrency(price, currency, locale)}`;
        }

        const schema = { ...DEFAULT_SCHEMA, ...this.config.schema };
        const fitur = attributes[schema.FEATURES!] || ((item.description && item.description.length < 100) ? item.description : null);

        if (fitur) {
            sent += `. Produk ini memiliki keunggulan berupa ${fitur}.`;
        } else {
            sent += `.`;
        }

        return sent;
    }
}

export default ResponseEngine;
