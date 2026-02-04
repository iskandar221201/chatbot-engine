/**
 * Assistant-in-a-Box Configuration
 * Reference: DOCUMENTATION.md Section 3 & 4
 */
window.ASSISTANT_CONFIG = {
    // A. Contact Information
    whatsappNumber: '6281234567890',

    // Auto-Discovery (New)
    autoCrawl: true,
    crawlMaxDepth: 2,

    // B. Sales Triggers (Multilingual Support)
    salesTriggers: {
        'beli': ['order', 'daftar', 'mau', 'booking', 'reservasi'],
        'harga': ['biaya', 'price', 'budget', 'tarif'],
        'promo': ['diskon', 'hemat', 'potongan']
    },

    // C. Comparison Features
    comparisonTriggers: [
        // Indonesian
        'bandingkan', 'banding', 'perbandingan', 'beda', 'perbedaan', 'lebih bagus',
        'mana yang', 'pilih mana', 'vs', 'versus', 'mending', 'bagusan',
        // Recommendation
        'rekomendasi', 'saran', 'paling', 'terbaik', 'top', 'rekomended',
        // English
        'compare', 'comparison', 'difference', 'best', 'better'
    ],
    comparisonLabels: {
        title: 'Produk',
        price: 'Harga',
        recommendation: '🏆 Rekomendasi',
        bestChoice: 'Pilihan Terbaik',
        reasons: 'Kenapa pilih ini?',
        noProducts: 'Maaf, tidak ada produk yang cocok untuk dibandingkan.',
    },

    // D. NLP & Correction
    phoneticMap: {
        "umroh": ["umrah", "umro", "umroh"],
        "turki": ["turkey", "turkiye", "turky"],
        "harga": ["hrg", "brp", "harge"]
    },
    semanticMap: {
        "murah": ["hemat", "terjangkau", "ekonomis", "budget"],
        "bagus": ["terbaik", "keren", "mantap", "recommended"]
    },

    // E. Advanced Business Logic (Reference: Doc Sec 3)
    entityDefinitions: {
        "isPremium": ["vip", "luxury", "eksklusif", "bintang 5"],
        "isDiscount": ["promo", "diskon", "hemat", "sale"]
    },
    intentRules: [
        {
            intent: "layanan_premium",
            conditions: {
                entities: ["isPremium"],
                tokens: ["exclusive", "vvip"]
            }
        },
        {
            intent: "mencari_promo",
            conditions: {
                entities: ["isDiscount"],
                tokens: ["murah", "potongan"]
            }
        }
    ],

    // F. Internal Schema & Extraction
    schema: {
        PRICE: 'harga',
        PRICE_PROMO: 'harga_promo',
        BADGE: 'badge',
        RECOMMENDED: 'direkomendasikan',
        FEATURES: 'fitur'
    },
    featurePatterns: [
        /(?:fitur|feature|keunggulan|detail)[:\s]*([^.]+)/gi,
        /(?:•|✓|★)([^•✓★\n]+)/g
    ]
};
