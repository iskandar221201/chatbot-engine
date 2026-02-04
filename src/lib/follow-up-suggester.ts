/**
 * Follow-Up Suggester
 * Generate smart follow-up questions to help close sales
 */

export interface FollowUpSuggestion {
    question: string;
    intent: string;
    priority: number;
    category: 'closing' | 'discovery' | 'objection' | 'engagement';
}

export interface FollowUpConfig {
    closingQuestions?: string[];
    discoveryQuestions?: string[];
    objectionHandlers?: Record<string, string[]>;
    customTemplates?: Record<string, string[]>;
    maxSuggestions?: number;
}

// Intent to follow-up mapping
const INTENT_FOLLOWUPS: Record<string, { questions: string[]; category: 'closing' | 'discovery' | 'objection' | 'engagement' }> = {
    // Price-related intents
    'sales_harga': {
        questions: [
            'Apakah budget Anda sudah mencakup biaya {additional}?',
            'Untuk range harga ini, apa prioritas utama Anda?',
            'Mau saya tunjukkan opsi dengan cicilan?',
            'Ada promo khusus untuk pembelian hari ini, tertarik?'
        ],
        category: 'discovery'
    },
    'sales_promo': {
        questions: [
            'Promo ini berlaku sampai {date}, mau saya proses sekarang?',
            'Dengan diskon ini, Anda hemat {amount}. Lanjut?',
            'Selain promo, ada bonus tambahan juga. Mau tahu?',
            'Stok promo terbatas, yakin tidak mau amankan sekarang?'
        ],
        category: 'closing'
    },
    'sales_fitur': {
        questions: [
            'Dari fitur-fitur tadi, mana yang paling penting untuk Anda?',
            'Fitur ini cocok untuk kebutuhan seperti apa Anda?',
            'Mau saya jelaskan lebih detail tentang {feature}?',
            'Sudah cukup info atau ada yang masih kurang jelas?'
        ],
        category: 'discovery'
    },
    'sales_beli': {
        questions: [
            'Baik! Mau pilih pembayaran transfer atau cicilan?',
            'Untuk pengiriman, alamatnya kemana?',
            'Kapan waktu paling pas untuk dikirim?',
            'Ada permintaan khusus untuk pesanannya?'
        ],
        category: 'closing'
    },
    'sales_stok': {
        questions: [
            'Stok tersedia! Mau langsung diproses?',
            'Stok terbatas, mau saya hold dulu untuk Anda?',
            'Kapan rencana pembeliannya?',
            'Kalau stok kosong, mau dinotif saat ready?'
        ],
        category: 'closing'
    },
    'sales_pengiriman': {
        questions: [
            'Untuk daerah Anda, estimasi {days} hari. Oke?',
            'Mau pakai ekspedisi apa? JNE, J&T, atau lainnya?',
            'Untuk pengiriman cepat ada opsi same-day. Tertarik?',
            'Alamat lengkapnya sudah benar seperti ini?'
        ],
        category: 'closing'
    },
    'sales_garansi': {
        questions: [
            'Garansi bisa diperpanjang. Mau sekalian?',
            'Selama garansi, semua pengajuan pasti diproses cepat. Deal?',
            'Dengan garansi ini, Anda terlindungi dari {coverage}. Aman kan?'
        ],
        category: 'objection'
    },
    // Chat intents
    'chat_greeting': {
        questions: [
            'Ada yang bisa saya bantu cari hari ini?',
            'Lagi cari produk apa nih?',
            'Mau lihat-lihat dulu atau sudah ada yang diincar?'
        ],
        category: 'discovery'
    },
    'chat_thanks': {
        questions: [
            'Sama-sama! Ada lagi yang mau ditanyakan?',
            'Senang bisa membantu! Kalau ada pertanyaan lain, tanya aja ya',
            'Ditunggu pesanannya ya! Ada yang lain?'
        ],
        category: 'engagement'
    },
    'chat_contact': {
        questions: [
            'Mau dihubungi lewat WhatsApp atau Email?',
            'Kapan waktu yang pas untuk dihubungi?',
            'Boleh minta nama dan nomor HP untuk follow up?'
        ],
        category: 'closing'
    }
};

// Objection patterns and handlers
const OBJECTION_PATTERNS: Record<string, { pattern: RegExp; responses: string[] }> = {
    'terlalu_mahal': {
        pattern: /mahal|kemahalan|overpriced|gak worth|tidak worth/i,
        responses: [
            'Saya paham budget jadi pertimbangan. Bisa ceritakan range yang nyaman?',
            'Ada opsi cicilan 0% yang bisa meringankan. Mau coba?',
            'Kalau dibandingkan dengan {competitor}, value-nya jauh lebih baik lho',
            'Mau saya carikan alternatif dengan budget lebih rendah?'
        ]
    },
    'pikir_dulu': {
        pattern: /pikir\s*dulu|pertimbang|nanti\s*aja|belum\s*yakin|ragu/i,
        responses: [
            'Tentu, ambil waktu Anda. Sambil mikir, ada yang mau ditanyakan lagi?',
            'Boleh tahu apa yang jadi pertimbangannya?',
            'Mau saya kirimkan detail lengkapnya via email untuk dipelajari?',
            'Kalau ada promo khusus untuk Anda, jadi lebih menarik gak?'
        ]
    },
    'cek_tempat_lain': {
        pattern: /bandingkan|compare|cek\s*dulu|tempat\s*lain|kompetitor|toko\s*lain/i,
        responses: [
            'Silakan bandingkan! Tapi info aja, kami ada garansi harga terendah',
            'Kalau Anda temukan lebih murah, kami bisa match. Deal?',
            'Apa yang jadi pembanding utamanya? Harga atau layanan?',
            'Kebanyakan customer balik kesini karena after-sales kami. Mau tahu kenapa?'
        ]
    },
    'tidak_butuh_sekarang': {
        pattern: /belum\s*butuh|nanti\s*aja|gak\s*urgent|tidak\s*buru/i,
        responses: [
            'Noted! Mau diingatkan kalau ada promo nanti?',
            'Kapan kira-kira rencananya butuh?',
            'Sekarang ada pre-order dengan harga spesial. Tertarik?',
            'Boleh minta kontak untuk update promo ke depannya?'
        ]
    }
};

export class FollowUpSuggester {
    private config: Required<FollowUpConfig>;

    constructor(config: FollowUpConfig = {}) {
        this.config = {
            closingQuestions: config.closingQuestions || [],
            discoveryQuestions: config.discoveryQuestions || [],
            objectionHandlers: config.objectionHandlers || {},
            customTemplates: config.customTemplates || {},
            maxSuggestions: config.maxSuggestions || 3
        };
    }

    /**
     * Get follow-up suggestions based on intent
     */
    suggest(intent: string, context?: {
        productName?: string;
        price?: number;
        userQuery?: string;
        messageCount?: number;
    }): FollowUpSuggestion[] {
        const suggestions: FollowUpSuggestion[] = [];

        // 1. Check for objections first
        if (context?.userQuery) {
            const objectionSuggestions = this.handleObjections(context.userQuery);
            suggestions.push(...objectionSuggestions);
        }

        // 2. Get intent-based suggestions
        const intentData = INTENT_FOLLOWUPS[intent];
        if (intentData) {
            const intentSuggestions = intentData.questions
                .slice(0, this.config.maxSuggestions)
                .map((q, i) => ({
                    question: this.fillTemplate(q, context),
                    intent,
                    priority: 80 - (i * 10),
                    category: intentData.category
                }));
            suggestions.push(...intentSuggestions);
        }

        // 3. Add custom templates if available
        if (this.config.customTemplates[intent]) {
            const custom = this.config.customTemplates[intent]
                .slice(0, 2)
                .map((q, i) => ({
                    question: this.fillTemplate(q, context),
                    intent,
                    priority: 70 - (i * 10),
                    category: 'discovery' as const
                }));
            suggestions.push(...custom);
        }

        // 4. Add closing questions if high message count (engaged lead)
        if (context?.messageCount && context.messageCount > 5) {
            const closingSuggestions = this.getClosingQuestions(context);
            suggestions.push(...closingSuggestions);
        }

        // Sort by priority and limit
        return suggestions
            .sort((a, b) => b.priority - a.priority)
            .slice(0, this.config.maxSuggestions);
    }

    /**
     * Handle objections and return appropriate responses
     */
    handleObjections(query: string): FollowUpSuggestion[] {
        const suggestions: FollowUpSuggestion[] = [];

        // Check built-in objection patterns
        for (const [type, data] of Object.entries(OBJECTION_PATTERNS)) {
            if (data.pattern.test(query)) {
                const response = data.responses[Math.floor(Math.random() * data.responses.length)];
                suggestions.push({
                    question: response,
                    intent: `objection_${type}`,
                    priority: 90, // High priority for objections
                    category: 'objection'
                });
                break; // Handle one objection at a time
            }
        }

        // Check custom objection handlers
        for (const [keyword, responses] of Object.entries(this.config.objectionHandlers)) {
            if (query.toLowerCase().includes(keyword)) {
                const response = responses[Math.floor(Math.random() * responses.length)];
                suggestions.push({
                    question: response,
                    intent: `objection_custom`,
                    priority: 85,
                    category: 'objection'
                });
            }
        }

        return suggestions;
    }

    /**
     * Get closing-focused questions
     */
    getClosingQuestions(context?: { productName?: string; price?: number }): FollowUpSuggestion[] {
        const defaultClosing = [
            'Sudah siap untuk lanjut ke pembayaran?',
            'Mau saya proses pesanannya sekarang?',
            'Kapan waktu yang tepat untuk follow up?',
            'Ada lagi yang perlu saya jelaskan sebelum deal?'
        ];

        const questions = [...this.config.closingQuestions, ...defaultClosing];

        return questions.slice(0, 2).map((q, i) => ({
            question: this.fillTemplate(q, context),
            intent: 'closing',
            priority: 100 - (i * 5),
            category: 'closing' as const
        }));
    }

    /**
     * Get discovery questions to understand customer better
     */
    getDiscoveryQuestions(): FollowUpSuggestion[] {
        const defaultDiscovery = [
            'Produk ini untuk penggunaan pribadi atau bisnis?',
            'Sebelumnya sudah pernah pakai produk serupa?',
            'Apa prioritas utama dalam memilih produk ini?',
            'Ada deadline tertentu untuk pembelian ini?'
        ];

        const questions = [...this.config.discoveryQuestions, ...defaultDiscovery];

        return questions.slice(0, 3).map((q, i) => ({
            question: q,
            intent: 'discovery',
            priority: 60 - (i * 5),
            category: 'discovery' as const
        }));
    }

    /**
     * Get a random follow-up for an intent
     */
    static getRandom(intent: string): string | null {
        const data = INTENT_FOLLOWUPS[intent];
        if (!data || data.questions.length === 0) return null;
        return data.questions[Math.floor(Math.random() * data.questions.length)];
    }

    /**
     * Check if a query looks like an objection
     */
    static isObjection(query: string): boolean {
        for (const data of Object.values(OBJECTION_PATTERNS)) {
            if (data.pattern.test(query)) return true;
        }
        return false;
    }

    private fillTemplate(template: string, context?: {
        productName?: string;
        price?: number;
        [key: string]: any;
    }): string {
        if (!context) return template;

        let result = template;

        // Replace known placeholders
        if (context.productName) {
            result = result.replace(/{product}/gi, context.productName);
        }
        if (context.price) {
            result = result.replace(/{price}/gi, `Rp ${context.price.toLocaleString('id-ID')}`);
        }

        // Replace generic placeholders with reasonable defaults
        result = result.replace(/{date}/gi, '3 hari lagi');
        result = result.replace(/{amount}/gi, 'puluhan ribu');
        result = result.replace(/{days}/gi, '2-3');
        result = result.replace(/{feature}/gi, 'fitur unggulan');
        result = result.replace(/{additional}/gi, 'instalasi');
        result = result.replace(/{coverage}/gi, 'kerusakan dan service gratis');
        result = result.replace(/{competitor}/gi, 'brand lain');

        return result;
    }
}

export default FollowUpSuggester;
