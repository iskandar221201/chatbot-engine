/**
 * Configuration Loader
 * Helper to load AssistantConfig from environment variables (process.env)
 * Useful for server-side implementations (Node.js, Bun, Deno)
 */

import type { AssistantConfig } from '../types';
import type { SecurityConfig } from './security-guard';
import type { LeadScoringConfig } from './lead-scoring';

export class ConfigLoader {
    /**
     * Load configuration from environment variables
     * Prefixed with AIB_ (Assistant In Box)
     */
    static loadFromEnv(): Partial<AssistantConfig> & { security?: SecurityConfig, leadScoring?: LeadScoringConfig } {
        // Ensure process is defined (server-side check)
        if (typeof process === 'undefined' || !process.env) {
            console.warn('ConfigLoader: process.env is not available. Returning empty config.');
            return {};
        }

        const env = process.env;
        const config: any = {};

        // General
        if (env.AIB_LOCALE) config.locale = env.AIB_LOCALE;
        if (env.AIB_CURRENCY) config.currencySymbol = env.AIB_CURRENCY;
        if (env.AIB_SEARCH_MODE) config.searchMode = env.AIB_SEARCH_MODE as 'local' | 'remote';
        if (env.AIB_API_URL) config.apiUrl = env.AIB_API_URL;
        if (env.AIB_DEBUG_MODE) config.debugMode = env.AIB_DEBUG_MODE === 'true';

        if (env.AIB_API_KEY) {
            config.apiHeaders = {
                'Authorization': `Bearer ${env.AIB_API_KEY}`,
                ...config.apiHeaders
            };
        }

        // Sales - Lead Scoring
        const leadScoring: LeadScoringConfig = {};
        if (env.AIB_SALES_HOT_THRESHOLD) leadScoring.hotThreshold = parseInt(env.AIB_SALES_HOT_THRESHOLD);

        if (env.AIB_SALES_WEIGHT_INTENT || env.AIB_SALES_WEIGHT_URGENCY) {
            leadScoring.weights = {
                intent: env.AIB_SALES_WEIGHT_INTENT ? parseInt(env.AIB_SALES_WEIGHT_INTENT) : 30,
                urgency: env.AIB_SALES_WEIGHT_URGENCY ? parseInt(env.AIB_SALES_WEIGHT_URGENCY) : 25,
                budget: env.AIB_SALES_WEIGHT_BUDGET ? parseInt(env.AIB_SALES_WEIGHT_BUDGET) : 20,
            };
        }

        if (env.AIB_SALES_BUYING_WORDS) {
            leadScoring.buyingIntentWords = env.AIB_SALES_BUYING_WORDS.split(',').map(s => s.trim());
        }

        // Sales Psychology
        const psychology: any = {};
        if (env.AIB_PSYCH_FOMO) psychology.enableFomo = env.AIB_PSYCH_FOMO === 'true';
        if (env.AIB_PSYCH_CROSS_SELL) psychology.enableCrossSell = env.AIB_PSYCH_CROSS_SELL === 'true';
        if (env.AIB_PSYCH_SOCIAL_PROOF) psychology.enableSocialProof = env.AIB_PSYCH_SOCIAL_PROOF === 'true';

        // Hybrid AI
        const hybrid: any = {};
        if (env.AIB_OPENAI_KEY) {
            hybrid.apiKey = env.AIB_OPENAI_KEY;
            hybrid.model = env.AIB_OPENAI_MODEL || 'gpt-3.5-turbo';
        }

        // Security
        const security: SecurityConfig = {};
        if (env.AIB_SECURITY_MAX_LENGTH) security.maxLength = parseInt(env.AIB_SECURITY_MAX_LENGTH);
        if (env.AIB_SECURITY_STRICT_MODE) security.strictMode = env.AIB_SECURITY_STRICT_MODE === 'true';
        if (env.AIB_SECURITY_ALLOWED_TAGS) {
            security.allowedTags = env.AIB_SECURITY_ALLOWED_TAGS.split(',').map(s => s.trim());
        }

        return {
            ...config,
            // Custom extra configs usually passed independently, but can be merged if Engine supports it
            // For now we return them so user can pass them to specific constructors
            security,
            leadScoring
        };
    }
}

export default ConfigLoader;
