/**
 * Hybrid LLM Connector
 * Connects the local sales engine to large language models for fallback responses.
 */

export interface LLMProvider {
    name: string;
    generateResponse(prompt: string, context?: any): Promise<string>;
}

export interface LLMConfig {
    provider?: LLMProvider;
    apiKey?: string;
    apiUrl?: string;
    model?: string;
    systemPrompt?: string;
}

export class OpenAIProvider implements LLMProvider {
    name = 'openai';
    private apiKey: string;
    private apiUrl: string;
    private model: string;

    constructor(apiKey: string, model = 'gpt-3.5-turbo', apiUrl = 'https://api.openai.com/v1/chat/completions') {
        this.apiKey = apiKey;
        this.model = model;
        this.apiUrl = apiUrl;
    }

    async generateResponse(prompt: string, context?: any): Promise<string> {
        // Safe check for missing key
        if (!this.apiKey) return "Maaf, saya belum dikonfigurasi sepenuhnya (Missing API Key).";

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: context?.systemPrompt || 'You are a helpful sales assistant.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 150
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            return data.choices[0]?.message?.content || "Maaf, saya sedang tidak bisa berpikir sekarang.";
        } catch (err: any) {
            console.error('LLM Error:', err);
            return "Maaf, koneksi ke otak kedua saya sedang gangguan.";
        }
    }
}

export class HybridAI {
    private provider: LLMProvider | null = null;
    private systemPrompt: string;

    constructor(config: LLMConfig = {}) {
        this.provider = config.provider || null;
        this.systemPrompt = config.systemPrompt ||
            "Anda adalah asisten sales yang ramah, membantu, dan persuasif. Jawab dalam Bahasa Indonesia.";

        // Auto-init default provider if keys provided
        if (!this.provider && config.apiKey) {
            this.provider = new OpenAIProvider(config.apiKey, config.model, config.apiUrl);
        }
    }

    async fallback(query: string, context?: any): Promise<string | null> {
        if (!this.provider) return null;

        return await this.provider.generateResponse(query, {
            systemPrompt: this.systemPrompt,
            ...context
        });
    }

    setProvider(provider: LLMProvider) {
        this.provider = provider;
    }
}

export default HybridAI;
