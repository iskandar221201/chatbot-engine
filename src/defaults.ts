export const DEFAULT_PHONETIC_MAP: Record<string, string[]> = {
    'bagaimana': ['bgmn', 'gimana', 'pripun', 'how'],
    'dimana': ['dimn', 'dmn', 'where'],
    'kapan': ['kpn', 'when'],
    'siapa': ['sp', 'sopo', 'who'],
    'apa': ['opo', 'what'],
    'kenapa': ['knp', 'mengapa', 'napa', 'why'],
    'harga': ['hargany', 'hargax', 'price'],
    'diskon': ['disk', 'potongan', 'discount'],
    'promo': ['promosi', 'pro'],
    'gratis': ['free', 'cuma-cuma'],
    'beli': ['order', 'pesen'],
};

export const DEFAULT_STOP_WORDS: string[] = [
    'dan', 'atau', 'tapi', 'namun', 'dengan', 'untuk', 'dari', 'yang', 'itu', 'ini',
    'ke', 'di', 'ada', 'adalah', 'bagi', 'pada', 'saya', 'anda', 'kamu', 'kami',
    'kita', 'mereka', 'sebuah', 'sudah', 'telah', 'akan', 'ingin', 'mau', 'bisa',
    'dapat', 'boleh', 'harus', 'perlu', 'juga', 'saja', 'pun', 'lah', 'kah', 'nya'
];

export const DEFAULT_SEMANTIC_MAP: Record<string, string[]> = {
    'beli': ['order', 'pesan', 'checkout', 'booking', 'ambil', 'dapatkan'],
    'harga': ['biaya', 'cost', 'budget', 'tarif', 'nilai', 'price'],
    'promo': ['diskon', 'discount', 'sale', 'hemat', 'off', 'potongan'],
    'fitur': ['keunggulan', 'kelebihan', 'fasilitas', 'spesifikasi', 'detail'],
    'kontak': ['hubungi', 'whatsapp', 'wa', 'email', 'alamat', 'telepon'],
    'murah': ['terjangkau', 'ekonomis', 'budget', 'grosir'],
    'premium': ['eksklusif', 'mewah', 'lux', 'v VIP'],
    'syarat': ['ketentuan', 'kondisi', 'requirement'],
};

export const DEFAULT_SALES_TRIGGERS: Record<string, string[]> = {
    'beli': ['beli', 'pesan', 'ambil', 'order', 'checkout', 'booking', 'buy', 'purchase', 'get', 'mau'],
    'harga': ['harga', 'biaya', 'price', 'budget', 'bayar', 'cicilan', 'dp', 'murah', 'cost', 'payment', 'cheap', 'tarif', 'berapa', 'nominal'],
    'promo': ['promo', 'diskon', 'discount', 'sale', 'hemat', 'bonus', 'voucher', 'off', 'sale'],
    'fitur': ['fitur', 'fiturnya', 'spesifikasi', 'spek', 'kelebihan', 'keunggulan', 'fasilitas', 'detail', 'benefit']
};

export const DEFAULT_CHAT_TRIGGERS: Record<string, string[]> = {
    'greeting': ['halo', 'halo', 'hi', 'helo', 'hey', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'permisi', 'hello'],
    'thanks': ['terima kasih', 'thanks', 'tq', 'syukron', 'makasih', 'oke', 'sip', 'mantap']
};

export const DEFAULT_CONTACT_TRIGGERS: string[] = ['kontak', 'contact', 'whatsapp', 'wa', 'email', 'telepon', 'phone', 'call', 'hubungi'];

export const DEFAULT_COMPARISON_LABELS = {
    title: 'Product',
    price: 'Price',
    recommendation: 'Recommendation',
    bestChoice: 'Best Choice',
    reasons: 'Reasons',
    noProducts: 'No products found to compare.',
    vsLabel: 'vs',
    discount: 'Diskon {discount}% dari harga normal',
    cheapest: 'Harga paling terjangkau',
    mostFeatures: 'Fitur paling lengkap',
    warranty: 'Garansi: {warranty}',
    teamRecommendation: 'Direkomendasikan oleh tim kami'
};

export const DEFAULT_ATTRIBUTE_EXTRACTORS: Record<string, RegExp> = {
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

export const DEFAULT_LABEL_MAP: Record<string, string> = {
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

export const DEFAULT_UI_CONFIG = {
    locale: 'id-ID',
    currencySymbol: 'Rp',
    answerTemplates: {
        price: 'Harga {title} adalah {currency} {price}',
        features: 'Fitur {title} meliputi: {features}',
        noResults: 'Maaf, saya tidak menemukan informasi tersebut.'
    },
    resultLimit: 5,
    subSearchJoiner: '. ',
    fallbackResponses: {
        'chat_greeting': 'Halo! Ada yang bisa saya bantu hari ini? Anda bisa tanya tentang produk, harga, atau promo kami.',
        'chat_thanks': 'Sama-sama! Senang bisa membantu. Ada lagi yang ingin ditanyakan?',
        'chat_contact': 'Anda bisa menghubungi kami melalui WhatsApp atau Email. Ingin saya hubungkan sekarang?'
    }
};

export const DEFAULT_CONJUNCTIONS = /\s+(?:trus|lalu|kemudian|dan|and|then)\s+|[?!;]|,/gi;

export const DEFAULT_FEATURE_PATTERNS = [
    /(?:fitur|feature|keunggulan|kelebihan)[:\s]*([^.]+)/gi,
    /(?:•|▪|★|✓|✔|-)([^•▪★✓✔\-\n]+)/g
];

export const DEFAULT_SCHEMA = {
    PRICE: 'harga',
    PRICE_PROMO: 'harga_promo',
    BADGE: 'badge',
    RECOMMENDED: 'direkomendasikan',
    FEATURES: 'fitur',
    RATING: 'rating',
    WARRANTY: 'garansi'
};
