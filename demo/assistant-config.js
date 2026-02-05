/**
 * Assistant-in-a-Box Configuration
 * Reference: DOCUMENTATION.md Section 3 & 4
 */
window.ASSISTANT_CONFIG = {
    // A. Contact Information
    whatsappNumber: '6281234567890', // Developer Support

    // Auto-Discovery (New)
    autoCrawl: true,
    crawlMaxDepth: 2,

    // Developer & Globalization
    debugMode: true,
    locale: 'id',

    // B. Sales Triggers (Multilingual Support)
    salesTriggers: {
        'beli': ['order', 'pakai', 'implementasi', 'integrasi', 'unduh'],
        'harga': ['biaya', 'tarif', 'berbayar', 'gratis', 'lisensi'],
        'promo': ['diskon', 'open source', 'free']
    },

    // C. Comparison Features
    comparisonTriggers: [
        // Indonesian
        'bandingkan', 'banding', 'perbandingan', 'beda', 'perbedaan', 'lebih bagus',
        'mana yang', 'pilih mana', 'vs', 'versus', 'mending', 'bagusan', 'hebat mana',
        // Recommendation
        'rekomendasi', 'saran', 'paling', 'terbaik', 'top', 'rekomended', 'andalan',
        // English
        'compare', 'comparison', 'difference', 'best', 'better', 'versus'
    ],

    // D. Context & Reference (New)
    referenceTriggers: [
        'itu', 'ini', 'tadi', 'yang mana', 'berapa', 'harganya', 'fiturnya',
        'ada gak', 'stoknya', 'warnanya', 'speknya', 'kelebihannya'
    ],

    comparisonLabels: {
        title: 'Fitur/Modul',
        price: 'Lisensi',
        recommendation: '🏆 Core Feature',
        bestChoice: 'Pilihan Utama',
        reasons: 'Mengapa ini penting?',
        noProducts: 'Maaf, tidak ada modul yang sesuai untuk dibandingkan.',
    },

    // D. NLP & Correction
    phoneticMap: {
        "umroh": ["umrah", "umro", "umroh"],
        "turki": ["turkey", "turkiye", "turky"],
        "harga": ["hrg", "brp", "harge"],
        "hp": ["handphone", "ponsel", "gadget", "smartphone"],
        "config": ["cfg", "konfig", "setting", "seting"],
        "date": ["dt", "tgl", "kapan"],
        "analytics": ["analitik", "metric", "metrik"]
    },

    semanticMap: {
        "murah": ["gratis", "open source", "terjangkau", "ekonomis", "free", "diskon", "hemat", "miring"],
        "bagus": ["terbaik", "keren", "mantap", "recommended", "enterprise", "top", "robust", "premium", "gacor", "handal"],
        "setup": ["instalasi", "konfigurasi", "cara pakai", "mulai", "integration", "integrasi", "pasang", "deployment", "implementasi"],
        "fitur": ["modul", "kemampuan", "fungsi", "keunggulan", "feature", "fitur-fitur", "spec", "spesifikasi"],
        "backend": ["server", "node", "nodejs", "server-side", "ssr", "bun", "deno"],
        "security": ["aman", "proteksi", "xss", "sanitasi", "safe", "keamanan", "hack", "guard"]
    },

    // E. Advanced Business Logic (Reference: Doc Sec 3)
    entityDefinitions: {
        "isPremium": ["vip", "luxury", "eksklusif", "bintang 5", "high-end", "flagship"],
        "isDiscount": ["promo", "diskon", "hemat", "sale", "deal", "off"]
    },

    intentRules: [
        {
            intent: "layanan_premium",
            conditions: {
                entities: ["isPremium"],
                tokens: ["exclusive", "vvip", "titanium"]
            }
        },
        {
            intent: "mencari_promo",
            conditions: {
                entities: ["isDiscount"],
                tokens: ["murah", "potongan", "cheap"]
            }
        },
        {
            intent: "mencari_wisata",
            conditions: {
                tokens: ["wisata", "jalan-jalan", "travel", "trip"]
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
    ],

    attributeLabels: {
        "kecepatan": "Latensi / Kecepatan",
        "koneksi": "Kebutuhan Koneksi",
        "keamanan": "Privasi Data",
        "biaya": "Skema Biaya"
    },

    // G. Sentiment & Empathy (New)
    sentimentPrefixes: {
        negative: [
            "Mohon maaf kak.",
            "Aduh, maaf ya atas ketidaknyamanannya.",
            "Kami mengerti kekecewaan kakak.",
            "Waduh, maaf banget ya kak.",
            "Duh, maaf ya kalo ada yang kurang berkenan."
        ],
        positive: [
            "Wah, asik! ",
            "Senang mendengarnya! ",
            "Mantap kak! ",
            "Terima kasih atas apresiasinya! ",
            "Ikut senang bacanya! "
        ]
    }
};
