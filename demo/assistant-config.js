/**
 * Assistant-in-a-Box Configuration
 * Reference: DOCUMENTATION.md Section 3 & 4
 */
window.ASSISTANT_CONFIG = {
    // A. Contact Information
    whatsappNumber: '6281234567890',

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
    }
};
