import type { AssistantDataItem, AssistantResult, AssistantConfig, ComparisonItem, ComparisonResult } from "./types";
import Fuse from "./lib/fuse";

export class AssistantEngine {
    private searchData: AssistantDataItem[];
    private Fuse: any;
    private fuse: any;
    private config: AssistantConfig;

    private history: {
        lastCategory: string | null;
        detectedEntities: Set<string>;
    };

    constructor(searchData: AssistantDataItem[], FuseClass: any = Fuse, config: AssistantConfig = {}) {
        this.searchData = searchData;
        this.Fuse = FuseClass;
        this.config = {
            phoneticMap: {},
            semanticMap: {},
            stopWords: [],
            entityDefinitions: {},
            intentRules: [],
            ...config
        };

        this.history = {
            lastCategory: null,
            detectedEntities: new Set(),
        };

        this.initFuse();
    }

    private initFuse() {
        if (this.Fuse) {
            this.fuse = new this.Fuse(this.searchData, {
                keys: [
                    { name: "title", weight: 0.8 },
                    { name: "keywords", weight: 0.5 },
                    { name: "description", weight: 0.2 },
                ],
                threshold: 0.45,
                includeScore: true,
                useExtendedSearch: true,
            });
        }
    }

    private autoCorrect(word: string): string {
        if (!this.config.phoneticMap) return word;
        for (const [correct, typos] of Object.entries(this.config.phoneticMap)) {
            if (typos.includes(word)) return correct;
        }
        return word;
    }

    private preprocess(query: string) {
        const signals = {
            isQuestion: query.includes('?'),
            isUrgent: query.includes('!'),
        };

        const stopWords = new Set(this.config.stopWords || []);
        // Step 0: Initial cleaning
        const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
        const rawWords = cleanQuery.split(/\s+/).filter(w => w.length > 1);

        // Step 1: Phonetic Auto-correct
        let correctedWords = rawWords.map(w => this.autoCorrect(w));

        // Step 2: Advanced Indonesian Stemming
        const stemmedWords = correctedWords.map(w => this.stemIndonesian(w));

        // Keep both original and stemmed for better coverage
        const allTokens = [...new Set([...correctedWords, ...stemmedWords])];
        const filteredWords = allTokens.filter(w => !stopWords.has(w));

        const expansion: string[] = [];
        filteredWords.forEach(w => {
            if (this.config.semanticMap && this.config.semanticMap[w]) {
                expansion.push(...this.config.semanticMap[w]);
            }
            // Also check expansion for stemmed version if different
            const stem = this.stemIndonesian(w);
            if (stem !== w && this.config.semanticMap && this.config.semanticMap[stem]) {
                expansion.push(...this.config.semanticMap[stem]);
            }
        });

        return {
            tokens: filteredWords,
            expanded: [...new Set([...filteredWords, ...expansion])],
            entities: this.extractEntities(filteredWords),
            signals
        };
    }

    private extractEntities(tokens: string[]) {
        const detected: Record<string, boolean> = {};
        if (this.config.entityDefinitions) {
            for (const [entityName, keywords] of Object.entries(this.config.entityDefinitions)) {
                const isPresent = tokens.some(t => keywords.includes(t));
                detected[entityName] = isPresent;
                if (isPresent) this.history.detectedEntities.add(entityName);
            }
        }
        return detected;
    }

    public async search(query: string): Promise<AssistantResult> {
        // Handle Remote Mode (Supports single or multiple APIs)
        if (this.config.searchMode === 'remote' && this.config.apiUrl) {
            try {
                const urls = Array.isArray(this.config.apiUrl) ? this.config.apiUrl : [this.config.apiUrl];
                const results = await Promise.all(urls.map(async (url) => {
                    try {
                        const response = await fetch(`${url}?q=${encodeURIComponent(query)}`, {
                            headers: this.config.apiHeaders || {}
                        });
                        return await response.json();
                    } catch (e) {
                        console.error(`Remote fetch failed for ${url}:`, e);
                        return { results: [], intent: 'fuzzy', entities: {} };
                    }
                }));

                // Merge all results
                const mergedResults = results.reduce((acc, curr) => {
                    acc.results.push(...(curr.results || []));
                    if (curr.intent && curr.intent !== 'fuzzy') acc.intent = curr.intent;
                    acc.entities = { ...acc.entities, ...(curr.entities || {}) };
                    return acc;
                }, { results: [], intent: 'fuzzy', entities: {}, confidence: 0 } as AssistantResult);

                if (mergedResults.results.length > 0) {
                    // Re-calculate scores for remote results to apply local sales-driven boosts
                    const processed = this.preprocess(query);
                    const ranked = mergedResults.results.map((item: AssistantDataItem) => ({
                        item,
                        score: this.calculateScore(item, processed, 0.5) // 0.5 as neutral fuse score for remote
                    })).sort((a: any, b: any) => b.score - a.score);

                    return {
                        ...mergedResults,
                        results: ranked.map((r: any) => r.item).slice(0, 5),
                        confidence: Math.min(Math.round(ranked[0].score * 2), 100)
                    };
                }
            } catch (error) {
                console.error("Remote search orchestration failed, falling back to local:", error);
            }
        }

        const processed = this.preprocess(query);
        let candidates: any[] = [];

        if (this.fuse) {
            // Use OR operator for semantic expansions
            const fuseResults = this.fuse.search(processed.expanded.join(' | '));
            candidates = fuseResults.map((f: any) => ({
                item: f.item,
                fuseScore: f.score
            }));
        }

        const finalResults = candidates.map(c => {
            const score = this.calculateScore(c.item, processed, c.fuseScore);
            return { item: c.item, score };
        });

        finalResults.sort((a, b) => b.score - a.score);

        if (finalResults.length > 0) {
            this.history.lastCategory = finalResults[0].item.category;
        }

        const intent = this.detectIntent(processed);
        const isConversational = intent.startsWith('chat_');

        // Fallback friendly responses for small talk
        let fallbackAnswer = "";
        if (intent === 'chat_greeting') {
            fallbackAnswer = this.config.fallbackIntentResponses?.['chat_greeting'] || "Halo! Ada yang bisa saya bantu hari ini? Anda bisa tanya tentang produk, harga, atau promo kami.";
        } else if (intent === 'chat_thanks') {
            fallbackAnswer = this.config.fallbackIntentResponses?.['chat_thanks'] || "Sama-sama! Senang bisa membantu. Ada lagi yang ingin ditanyakan?";
        }

        const topMatches = finalResults
            .filter(r => r.score > 10 || (isConversational && r.score > 5))
            .map(r => r.item)
            .slice(0, 5);

        return {
            results: topMatches,
            intent: intent,
            entities: processed.entities,
            confidence: finalResults.length > 0 ? Math.min(Math.round(finalResults[0].score * 2), 100) : (isConversational ? 80 : 0),
            answer: fallbackAnswer || (topMatches[0]?.answer || "")
        };
    }

    private calculateDiceCoefficient(s1: string, s2: string): number {
        const getBigrams = (str: string) => {
            const bigrams = new Set<string>();
            for (let i = 0; i < str.length - 1; i++) {
                bigrams.add(str.substring(i, i + 2));
            }
            return bigrams;
        };

        if (s1 === s2) return 1;
        if (s1.length < 2 || s2.length < 2) return 0;

        const bigrams1 = getBigrams(s1);
        const bigrams2 = getBigrams(s2);

        let intersection = 0;
        for (const bigram of bigrams1) {
            if (bigrams2.has(bigram)) intersection++;
        }

        return (2 * intersection) / (bigrams1.size + bigrams2.size);
    }

    private stemIndonesian(word: string): string {
        let stemmed = word.toLowerCase();

        // 1. Remove inflectional suffixes (-lah, -kah, -ku, -mu, -nya)
        const particleSuffixes = ['lah', 'kah', 'pun', 'ku', 'mu', 'nya'];
        for (const s of particleSuffixes) {
            if (stemmed.endsWith(s) && stemmed.length > s.length + 3) {
                stemmed = stemmed.slice(0, -s.length);
                break;
            }
        }

        // 2. Remove derivational suffixes (-kan, -an, -i)
        const derivationSuffixes = ['kan', 'an', 'i'];
        for (const s of derivationSuffixes) {
            if (stemmed.endsWith(s) && stemmed.length > s.length + 3) {
                // Special case for 'i' to avoid overstemming
                if (s === 'i' && stemmed.endsWith('ti')) continue;
                stemmed = stemmed.slice(0, -s.length);
                break;
            }
        }

        // 3. Remove derivational prefixes (me-, pe-, di-, ter-, ke-, ber-, se-)
        // This is a simplified version of Sastrawi logic
        const prefixes = ['memper', 'pember', 'penge', 'peng', 'peny', 'pen', 'pem', 'per', 'pe', 'ber', 'be', 'ter', 'te', 'me', 'di', 'ke', 'se'];
        for (const p of prefixes) {
            if (stemmed.startsWith(p) && stemmed.length > p.length + 3) {
                // Rule-based root recovery (simplified)
                if (p === 'mem' && 'aiueo'.includes(stemmed[3])) stemmed = 'p' + stemmed.slice(3);
                else if (p === 'men' && 'aiueo'.includes(stemmed[3])) stemmed = 't' + stemmed.slice(3);
                else if (p === 'meng' && 'aiueo'.includes(stemmed[4])) stemmed = 'k' + stemmed.slice(4);
                else if (p === 'meny' && 'aiueo'.includes(stemmed[4])) stemmed = 's' + stemmed.slice(4);
                else stemmed = stemmed.slice(p.length);
                break;
            }
        }

        return stemmed;
    }

    private calculateScore(item: AssistantDataItem, processed: any, fuseScore: number): number {
        let score = (1 - fuseScore) * 10;
        const titleLower = item.title.toLowerCase();
        const descriptionLower = item.description.toLowerCase();
        const keywordsLower = (item.keywords || []).map(k => k.toLowerCase());
        const fullContent = (titleLower + ' ' + keywordsLower.join(' ') + ' ' + descriptionLower);

        // A. Token Matching & N-Gram overlap (Dice)
        processed.tokens.forEach((token: string, i: number) => {
            if (fullContent.includes(token)) {
                score += 10;
                // Bonus for sequential match
                if (i > 0 && fullContent.includes(processed.tokens[i - 1] + ' ' + token)) score += 8;
            }

            // Dice similarity bonus for Title
            const diceTitle = this.calculateDiceCoefficient(token, titleLower);
            if (diceTitle > 0.4) score += (diceTitle * 15);
        });

        // B. Exact hits on title/category (Higher Weight)
        processed.tokens.forEach((token: string) => {
            if (titleLower.includes(token)) score += 20;
            if (item.category.toLowerCase().includes(token)) score += 25;
            if (keywordsLower.includes(token)) score += 15;
        });

        // C. Phrase overlap (Dice Coefficient for full query vs title)
        const fullQueryDice = this.calculateDiceCoefficient(processed.tokens.join(''), titleLower.replace(/\s/g, ''));
        if (fullQueryDice > 0.3) score += (fullQueryDice * 40);

        // D. Context & Business Logic
        if (this.history.lastCategory === item.category) score += 10;
        if (item.is_recommended) score += 25;

        // E. Punctuation Intelligence Boost
        if (processed.signals?.isQuestion) {
            // Favor items with explicit answers for questions
            if (item.answer) score += 15;
            // Also slight boost for categories that answer common questions
            if (item.category.toLowerCase().includes('layanan') || item.category.toLowerCase().includes('syarat')) score += 5;
        }

        if (processed.signals?.isUrgent) {
            score += 10; // General boost for urgent queries
        }

        const intent = this.detectIntent(processed);
        if (intent.startsWith('sales_')) {
            if (item.price_numeric || item.sale_price) score += 30;
            if (item.badge_text) score += 15;
            if (item.category.toLowerCase().includes('produk') || item.category.toLowerCase().includes('layanan')) score += 20;
        }

        return score;
    }

    private detectIntent(processed: any): string {
        // Multi-language default sales triggers
        const defaultSalesTriggers = {
            'beli': ['beli', 'pesan', 'ambil', 'order', 'checkout', 'booking', 'buy', 'purchase', 'get'],
            'harga': ['harga', 'biaya', 'price', 'budget', 'bayar', 'cicilan', 'dp', 'murah', 'cost', 'payment', 'cheap'],
            'promo': ['promo', 'diskon', 'discount', 'sale', 'hemat', 'bonus', 'voucher', 'off']
        };

        const triggers = { ...defaultSalesTriggers, ...(this.config.salesTriggers || {}) };

        // Stem tokens for intent matching as well
        const stemmedTokens = processed.tokens.map((t: string) => this.stemIndonesian(t));

        for (const [intent, tokens] of Object.entries(triggers)) {
            if (tokens.some(t => stemmedTokens.includes(t) || processed.tokens.includes(t))) return `sales_${intent}`;
        }

        // Conversational triggers (Greeting, Thanks)
        const defaultChatTriggers = {
            'greeting': ['halo', 'halo', 'hi', 'helo', 'hey', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'permisi', 'hello'],
            'thanks': ['terima kasih', 'thanks', 'tq', 'syukron', 'makasih', 'oke', 'sip', 'mantap']
        };
        const chatTriggers = { ...defaultChatTriggers, ...(this.config.conversationTriggers || {}) };

        for (const [intent, tokens] of Object.entries(chatTriggers)) {
            if (tokens.some(t => stemmedTokens.includes(t) || processed.tokens.includes(t))) return `chat_${intent}`;
        }

        if (!this.config.intentRules) return 'fuzzy';

        for (const rule of this.config.intentRules) {
            const entityMatch = !rule.conditions.entities || rule.conditions.entities.some(e => processed.entities[e]);
            const tokenMatch = !rule.conditions.tokens || rule.conditions.tokens.some(t => processed.tokens.includes(t) || stemmedTokens.includes(t));

            if (entityMatch && tokenMatch) return rule.intent;
        }

        return 'fuzzy';
    }

    // ===== PRODUCT COMPARISON SYSTEM =====

    /**
     * Get comparison triggers from config
     */
    private getComparisonTriggers(): string[] {
        return this.config.comparisonTriggers || [];
    }

    /**
     * Get labels for comparison output from config
     */
    private getComparisonLabels() {
        const defaults = {
            title: 'Product',
            price: 'Price',
            recommendation: 'Recommendation',
            bestChoice: 'Best Choice',
            reasons: 'Reasons',
            noProducts: 'No products found to compare.',
            vsLabel: 'vs'
        };
        return { ...defaults, ...(this.config.comparisonLabels || {}) };
    }

    /**
     * Check if query is a comparison request
     */
    public isComparisonQuery(query: string): boolean {
        const triggers = this.getComparisonTriggers();
        const queryLower = query.toLowerCase();

        // 1. Direct match
        if (triggers.some(t => queryLower.includes(t))) return true;

        // 2. Fuzzy match for triggers (handle "paleng" vs "paling", "rekomen" vs "rekomended")
        const words = queryLower.split(/\s+/);
        for (const word of words) {
            for (const trigger of triggers) {
                // Skip short triggers for fuzzy match to avoid false positives
                if (trigger.length < 4) continue;

                // Simple levenshtein-like check or substring check
                if (this.calculateDiceCoefficient(word, trigger) > 0.7) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Extract attributes from description text
     */
    private extractAttributes(item: AssistantDataItem): Record<string, string | number | boolean> {
        const attributes: Record<string, string | number | boolean> = {};
        const description = (item.description || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        const fullText = `${title} ${description}`;

        // Default attribute patterns (can be overridden via config)
        const defaultExtractors: Record<string, RegExp> = {
            // Price patterns
            'harga': /(?:harga|price|biaya)[:\s]*(?:rp\.?|idr)?\s*([\d.,]+)/i,
            // Capacity/size patterns
            'kapasitas': /(?:kapasitas|capacity)[:\s]*([\d.,]+\s*(?:gb|mb|tb|liter|kg|gram|ml|l|g))/i,
            // Speed patterns
            'kecepatan': /(?:kecepatan|speed)[:\s]*([\d.,]+\s*(?:mbps|gbps|rpm|mhz|ghz))/i,
            // Warranty patterns
            'garansi': /(?:garansi|warranty)[:\s]*([\d]+\s*(?:tahun|bulan|year|month|hari|day)s?)/i,
            // Rating patterns
            'rating': /(?:rating|bintang|star)[:\s]*([\d.,]+)/i,
            // Material patterns
            'material': /(?:bahan|material)[:\s]*([a-zA-Z\s]+?)(?:\.|,|$)/i,
            // Color patterns
            'warna': /(?:warna|color|colour)[:\s]*([a-zA-Z\s]+?)(?:\.|,|$)/i,
            // Dimension patterns
            'ukuran': /(?:ukuran|size|dimensi|dimension)[:\s]*([\d.,x\s]+(?:cm|mm|m|inch)?)/i,
        };

        // Merge with custom extractors from config
        const extractors = { ...defaultExtractors };
        if (this.config.attributeExtractors) {
            for (const [key, pattern] of Object.entries(this.config.attributeExtractors)) {
                extractors[key] = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
            }
        }

        // Extract attributes using patterns
        for (const [attrName, pattern] of Object.entries(extractors)) {
            const match = fullText.match(pattern);
            if (match && match[1]) {
                attributes[attrName] = match[1].trim();
            }
        }

        // Add existing structured data
        if (item.price_numeric) attributes['harga'] = item.price_numeric;
        if (item.sale_price) attributes['harga_promo'] = item.sale_price;
        if (item.badge_text) attributes['badge'] = item.badge_text;
        if (item.is_recommended) attributes['direkomendasikan'] = true;

        // Extract features from description (bullet points or comma-separated)
        const featurePatterns = [
            /(?:fitur|feature|keunggulan|kelebihan)[:\s]*([^.]+)/gi,
            /(?:•|▪|★|✓|✔|-)([^•▪★✓✔\-\n]+)/g
        ];

        const features: string[] = [];
        for (const pattern of featurePatterns) {
            let match;
            while ((match = pattern.exec(fullText)) !== null) {
                const feature = match[1].trim();
                if (feature.length > 3 && feature.length < 100) {
                    features.push(feature);
                }
            }
        }
        if (features.length > 0) {
            attributes['fitur'] = features.slice(0, 5).join('; ');
        }

        return attributes;
    }

    /**
     * Calculate comparison score for an item
     */
    private calculateComparisonScore(item: AssistantDataItem, attributes: Record<string, string | number | boolean>): number {
        let score = 0;

        // Price advantage (lower is better, sale price bonus)
        if (item.sale_price && item.price_numeric) {
            const discount = ((item.price_numeric - item.sale_price) / item.price_numeric) * 100;
            score += Math.min(discount, 50); // Max 50 points for discount
        }

        // Recommendation bonus
        if (item.is_recommended) score += 30;

        // Badge bonus
        if (item.badge_text) {
            const badgeLower = item.badge_text.toLowerCase();
            if (badgeLower.includes('best') || badgeLower.includes('terbaik')) score += 25;
            if (badgeLower.includes('popular') || badgeLower.includes('populer')) score += 20;
            if (badgeLower.includes('new') || badgeLower.includes('baru')) score += 15;
            if (badgeLower.includes('sale') || badgeLower.includes('promo')) score += 15;
        }

        // Feature richness bonus
        const featureCount = Object.keys(attributes).length;
        score += Math.min(featureCount * 5, 25);

        // Rating bonus
        if (attributes['rating']) {
            const rating = parseFloat(String(attributes['rating']));
            if (!isNaN(rating)) score += rating * 5;
        }

        // Warranty bonus
        if (attributes['garansi']) {
            const warrantyMatch = String(attributes['garansi']).match(/(\d+)/);
            if (warrantyMatch) {
                const years = parseInt(warrantyMatch[1]);
                score += Math.min(years * 10, 30);
            }
        }

        return score;
    }

    /**
     * Generate recommendation reasons
     */
    private generateReasons(item: ComparisonItem, allItems: ComparisonItem[]): string[] {
        const reasons: string[] = [];
        const labels = this.getComparisonLabels();

        // Price comparison
        if (item.salePrice && item.price) {
            const discount = Math.round(((item.price - item.salePrice) / item.price) * 100);
            reasons.push(`Diskon ${discount}% dari harga normal`);
        }

        // Cheapest check
        const prices = allItems.filter(i => i.price || i.salePrice).map(i => i.salePrice || i.price || Infinity);
        const myPrice = item.salePrice || item.price || Infinity;
        if (myPrice === Math.min(...prices) && prices.length > 1) {
            reasons.push('Harga paling terjangkau');
        }

        // Most features
        const featureCounts = allItems.map(i => Object.keys(i.attributes).length);
        if (Object.keys(item.attributes).length === Math.max(...featureCounts) && featureCounts.length > 1) {
            reasons.push('Fitur paling lengkap');
        }

        // Has warranty
        if (item.attributes['garansi']) {
            reasons.push(`Garansi: ${item.attributes['garansi']}`);
        }

        // Is recommended
        if (item.isRecommended) {
            reasons.push('Direkomendasikan oleh tim kami');
        }

        return reasons.slice(0, 4);
    }

    /**
     * Generate comparison table in HTML
     */
    private generateTableHtml(items: ComparisonItem[], attributeLabels: string[]): string {
        const labels = this.getComparisonLabels();

        if (items.length === 0) {
            return `<p>${labels.noProducts}</p>`;
        }

        let html = `<table class="comparison-table" style="width:100%;border-collapse:collapse;font-size:14px;">`;

        // Header row
        html += `<thead><tr style="background:#f5f5f5;">`;
        html += `<th style="padding:12px;border:1px solid #ddd;text-align:left;">${labels.title}</th>`;
        for (const item of items) {
            const recommended = item.isRecommended ? ' ⭐' : '';
            html += `<th style="padding:12px;border:1px solid #ddd;text-align:center;">${item.title}${recommended}</th>`;
        }
        html += `</tr></thead>`;

        // Body rows
        html += `<tbody>`;

        // Price row (always show if available)
        const hasPrice = items.some(i => i.price || i.salePrice);
        if (hasPrice) {
            html += `<tr>`;
            html += `<td style="padding:10px;border:1px solid #ddd;font-weight:bold;">${labels.price}</td>`;
            for (const item of items) {
                let priceHtml = '-';
                if (item.salePrice && item.price && item.salePrice < item.price) {
                    priceHtml = `<span style="text-decoration:line-through;color:#999;">Rp ${item.price.toLocaleString('id-ID')}</span><br><span style="color:#e53935;font-weight:bold;">Rp ${item.salePrice.toLocaleString('id-ID')}</span>`;
                } else if (item.price) {
                    priceHtml = `Rp ${item.price.toLocaleString('id-ID')}`;
                } else if (item.salePrice) {
                    priceHtml = `<span style="color:#e53935;font-weight:bold;">Rp ${item.salePrice.toLocaleString('id-ID')}</span>`;
                }
                html += `<td style="padding:10px;border:1px solid #ddd;text-align:center;">${priceHtml}</td>`;
            }
            html += `</tr>`;
        }

        // Attribute rows
        for (const attr of attributeLabels) {
            if (attr === 'harga' || attr === 'harga_promo') continue; // Already handled
            html += `<tr>`;
            html += `<td style="padding:10px;border:1px solid #ddd;font-weight:bold;">${this.formatAttributeLabel(attr)}</td>`;
            for (const item of items) {
                const value = item.attributes[attr];
                let displayValue = '-';
                if (value !== undefined && value !== null) {
                    if (typeof value === 'boolean') {
                        displayValue = value ? '✓' : '✗';
                    } else {
                        displayValue = String(value);
                    }
                }
                html += `<td style="padding:10px;border:1px solid #ddd;text-align:center;">${displayValue}</td>`;
            }
            html += `</tr>`;
        }

        html += `</tbody></table>`;
        return html;
    }

    /**
     * Generate comparison table in Markdown
     */
    private generateTableMarkdown(items: ComparisonItem[], attributeLabels: string[]): string {
        const labels = this.getComparisonLabels();

        if (items.length === 0) {
            return labels.noProducts;
        }

        let md = '';

        // Header row
        md += `| ${labels.title} |`;
        for (const item of items) {
            const recommended = item.isRecommended ? ' ⭐' : '';
            md += ` ${item.title}${recommended} |`;
        }
        md += '\n';

        // Separator
        md += `|---|`;
        for (let i = 0; i < items.length; i++) {
            md += `---|`;
        }
        md += '\n';

        // Price row
        const hasPrice = items.some(i => i.price || i.salePrice);
        if (hasPrice) {
            md += `| **${labels.price}** |`;
            for (const item of items) {
                if (item.salePrice && item.price && item.salePrice < item.price) {
                    md += ` ~~Rp ${item.price.toLocaleString('id-ID')}~~ **Rp ${item.salePrice.toLocaleString('id-ID')}** |`;
                } else if (item.price) {
                    md += ` Rp ${item.price.toLocaleString('id-ID')} |`;
                } else if (item.salePrice) {
                    md += ` **Rp ${item.salePrice.toLocaleString('id-ID')}** |`;
                } else {
                    md += ` - |`;
                }
            }
            md += '\n';
        }

        // Attribute rows
        for (const attr of attributeLabels) {
            if (attr === 'harga' || attr === 'harga_promo') continue;
            md += `| **${this.formatAttributeLabel(attr)}** |`;
            for (const item of items) {
                const value = item.attributes[attr];
                let displayValue = '-';
                if (value !== undefined && value !== null) {
                    if (typeof value === 'boolean') {
                        displayValue = value ? '✓' : '✗';
                    } else {
                        displayValue = String(value);
                    }
                }
                md += ` ${displayValue} |`;
            }
            md += '\n';
        }

        return md;
    }

    /**
     * Format attribute label for display
     */
    private formatAttributeLabel(attr: string): string {
        const labelMap: Record<string, string> = {
            'harga': 'Harga',
            'harga_promo': 'Harga Promo',
            'kapasitas': 'Kapasitas',
            'kecepatan': 'Kecepatan',
            'garansi': 'Garansi',
            'rating': 'Rating',
            'material': 'Material',
            'warna': 'Warna',
            'ukuran': 'Ukuran',
            'fitur': 'Fitur',
            'badge': 'Badge',
            'direkomendasikan': 'Rekomendasi'
        };
        return labelMap[attr] || attr.charAt(0).toUpperCase() + attr.slice(1);
    }

    /**
     * Main comparison method - compares products based on query or category
     */
    public async compareProducts(query: string, category?: string, maxItems: number = 4): Promise<ComparisonResult> {
        // Get relevant products
        let candidates: AssistantDataItem[] = [];

        if (category) {
            // Filter by category
            candidates = this.searchData.filter(item =>
                item.category.toLowerCase().includes(category.toLowerCase())
            );
        } else {
            // Use search to find relevant products
            const searchResult = await this.search(query);
            candidates = searchResult.results;
        }

        // If still no candidates, try to extract category from query
        if (candidates.length === 0) {
            const processed = this.preprocess(query);
            for (const item of this.searchData) {
                const titleLower = item.title.toLowerCase();
                const categoryLower = item.category.toLowerCase();
                if (processed.tokens.some(t => titleLower.includes(t) || categoryLower.includes(t))) {
                    candidates.push(item);
                }
            }
        }

        // FALLBACK: If still no candidates, use all products for general comparison
        if (candidates.length === 0) {
            candidates = [...this.searchData];
        }

        // Limit candidates
        candidates = candidates.slice(0, maxItems);

        // Extract attributes for each candidate
        const comparisonItems: ComparisonItem[] = candidates.map(item => {
            const attributes = this.extractAttributes(item);
            const score = this.calculateComparisonScore(item, attributes);

            return {
                title: item.title,
                attributes,
                score,
                isRecommended: item.is_recommended || false,
                url: item.url,
                price: item.price_numeric,
                salePrice: item.sale_price
            };
        });

        // Sort by score
        comparisonItems.sort((a, b) => b.score - a.score);

        // Collect all unique attribute labels
        const allAttributes = new Set<string>();
        for (const item of comparisonItems) {
            for (const attr of Object.keys(item.attributes)) {
                allAttributes.add(attr);
            }
        }
        const attributeLabels = Array.from(allAttributes);

        // Generate recommendation
        let recommendation = null;
        if (comparisonItems.length > 0) {
            const bestItem = comparisonItems[0];
            const reasons = this.generateReasons(bestItem, comparisonItems);
            recommendation = {
                item: bestItem,
                reasons
            };
        }

        // Generate tables
        const tableHtml = this.generateTableHtml(comparisonItems, attributeLabels);
        const tableMarkdown = this.generateTableMarkdown(comparisonItems, attributeLabels);

        return {
            items: comparisonItems,
            attributeLabels,
            recommendation,
            tableHtml,
            tableMarkdown
        };
    }

    /**
     * Enhanced search that auto-detects comparison intent
     */
    public async searchWithComparison(query: string): Promise<AssistantResult & { comparison?: ComparisonResult }> {
        const baseResult = await this.search(query);

        // Check if this is a comparison query
        if (this.isComparisonQuery(query)) {
            const comparison = await this.compareProducts(query);
            const labels = this.getComparisonLabels();

            // Build answer with comparison
            let answer = '';
            if (comparison.recommendation) {
                answer = `${labels.recommendation}: **${comparison.recommendation.item.title}**\n\n`;
                if (comparison.recommendation.reasons.length > 0) {
                    answer += `${labels.reasons}:\n`;
                    for (const reason of comparison.recommendation.reasons) {
                        answer += `• ${reason}\n`;
                    }
                }
                answer += `\n${comparison.tableMarkdown}`;
            } else {
                answer = labels.noProducts;
            }

            return {
                ...baseResult,
                intent: 'comparison',
                answer,
                comparison
            };
        }

        return baseResult;
    }
}
