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
    'dapat', 'boleh', 'harus', 'perlu', 'juga', 'saja', 'pun', 'lah', 'kah', 'nya',
    'apa', 'apaan', 'bagaimana', 'gimana', 'siapa', 'kapan', 'dimana', 'kenapa', 'mengapa',
    'berapa', 'mana', 'setiap', 'sangat', 'sekali', 'tentang', 'yakni', 'yaitu',
    'kok', 'deh', 'dong', 'sih', 'tah', 'punya', 'oleh', 'olehnya'
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

export const DEFAULT_CONTACT_TRIGGERS: string[] = ['kontak', 'contact', 'whatsapp', 'wa', 'email', 'telepon', 'phone', 'call', 'hubungi', 'tanya admin', 'chat admin', 'nanya'];

export const DEFAULT_COMPARISON_LABELS = {
    title: 'Produk',
    price: 'Harga',
    recommendation: 'Pilihan Terbaik',
    bestChoice: 'Rekomendasi Utama',
    reasons: 'Mengapa ini cocok untuk Anda?',
    noProducts: 'Maaf, saya tidak menemukan produk yang pas untuk dibandingkan.',
    vsLabel: 'vs',
    discount: 'Hemat {discount}% dari harga normal!',
    cheapest: 'Paling ekonomis di kelasnya',
    mostFeatures: 'Fitur paling lengkap & canggih',
    warranty: 'Jaminan Garansi: {warranty}',
    teamRecommendation: 'Sangat direkomendasikan oleh tim kami'
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
    'fitur': 'Fitur Utama',
    'badge': 'Status',
    'direkomendasikan': 'Rekomendasi'
};

export const DEFAULT_UI_CONFIG = {
    locale: 'id-ID',
    currencySymbol: 'Rp',
    answerTemplates: {
        price: 'Tentu! Harga {title} saat ini adalah {currency} {price}. Menarik banget kan?',
        features: 'Ini dia beberapa keunggulan dari {title}: {features}. Gimana, sesuai kebutuhan Anda?',
        noResults: 'Aduh, maaf banget ya, saya belum nemu info soal itu. Mungkin bisa coba tanya yang lain?'
    },
    resultLimit: 5,
    subSearchJoiner: '. Dan juga, ',
    fallbackResponses: {
        'chat_greeting': 'Halo! Senang sekali Anda mampir. Ada yang bisa saya bantu cari hari ini? Tanya soal paket atau promo juga boleh lho!',
        'chat_thanks': 'Sama-sama! Senang banget bisa bantu. Kalau ada yang bingung lagi, tanya aja ya!',
        'chat_contact': 'Tentu! Anda bisa langsung ngobrol sama tim admin kami lewat WhatsApp. Mau saya sambungkan sekarang?'
    },
    crawlerCategory: 'Page'
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
