window.SAMPLE_PRODUCTS = [
    // --- CORE ARCHITECTURE & ENGINES ---
    {
        "title": "Arsitektur Umum",
        "category": "Architecture",
        "description": "Framework enterprise modular yang terdiri dari Type System, Engine Layer, Sales Intelligence, dan Enterprise Layer.",
        "answer": "Arsitektur kami modular kak, ada Engine Layer untuk NLP, Sales Intelligence untuk konversi, dan Enterprise Layer untuk skalabilitas.",
        "url": "#",
        "keywords": ["arsitektur", "struktur", "folder", "layer", "komponen", "modular", "framework", "sistem", "build", "core"]
    },
    {
        "title": "AssistantEngine (src/engine.ts)",
        "category": "Core",
        "description": "Orchestrator pusat yang mengoordinasikan semua sub-engine untuk memproses query.",
        "answer": "AssistantEngine itu otak utamanya. Dia yang manggil-manggil sub-engine lain buat kelola chat kamu sampe jadi jawaban.",
        "url": "#",
        "keywords": ["engine", "pencarian", "orchestrator", "pusat", "core", "utama", "search"]
    },
    {
        "title": "QueryOrchestrator",
        "category": "Sub-Engine",
        "description": "Menangani normalisasi query, deteksi entitas, dan pengayaan kata kunci sebelum pencarian.",
        "answer": "QueryOrchestrator bertugas benerin chat kamu yang typo, deteksi apa yang kamu cari, dan nambahin keyword relevan otomatis.",
        "url": "#",
        "keywords": ["query", "orchestrator", "normalisasi", "entitas", "entity", "keyword", "enrichment", "pencarian"]
    },
    {
        "title": "ScoringEngine & Ranking",
        "category": "Sub-Engine",
        "description": "Logika penilaian hasil pencarian menggunakan Dice Coefficient, weighting, dan contextual boosting.",
        "answer": "ScoringEngine kasih nilai buat tiap hasil. Makin tinggi nilainya (Dice Coefficient), makin atas posisinya di hasil chat.",
        "url": "#",
        "keywords": ["scoring", "ranking", "relevansi", "dice", "weighting", "bobot", "peringkat", "urutan", "coefficient"]
    },
    {
        "title": "ContextEngine & Entity Locking",
        "category": "Sub-Engine",
        "description": "Memahami referensi (pronomina) dan menjaga status percakapan agar tetap nyambung.",
        "answer": "ContextEngine bikin bot inget apa yang diomongin sebelumnya. Kalau kamu bilang 'kalo yang itu?', bot tau 'itu' maksudnya apa.",
        "url": "#",
        "keywords": ["context", "konteks", "paham", "nyambung", "referensi", "history", "sebelumnya", "memory", "ingatan", "pronomina", "locking"]
    },
    {
        "title": "IntentOrchestrator",
        "category": "Sub-Engine",
        "description": "Deteksi maksud user menggunakan NLP Classifier dan Rule-based triggers.",
        "answer": "IntentOrchestrator tau apakah kamu lagi mau beli, cuma nanya, atau komplain, supaya bot bisa respon dengan gaya yang pas.",
        "url": "#",
        "keywords": ["intent", "maksud", "tujuan", "orchestrator", "ai", "classifier", "rule", "deteksi", "classification"]
    },
    {
        "title": "ResponseEngine",
        "category": "Sub-Engine",
        "description": "Template generator yang menyusun jawaban akhir berdasarkan data hasil pencarian dan context.",
        "answer": "ResponseEngine yang nulis kalimat jawaban buat kamu. Dia gabungin data produk sama kata-kata ramah biar enak dibaca.",
        "url": "#",
        "keywords": ["response", "jawaban", "balasan", "template", "generator", "formatting", "output"]
    },
    {
        "title": "PreprocessingEngine",
        "category": "Sub-Engine",
        "description": "Menangani Case Folding, Tokenizing, dan Stemming Bahasa Indonesia.",
        "answer": "PreprocessingEngine bertugas bersihin teks input kamu: ngilangin tanda baca, ngubah ke huruf kecil, sampe cari kata dasar (stemming).",
        "url": "#",
        "keywords": ["preprocessing", "stemming", "tokenizing", "clean", "bersih", "input", "normalization"]
    },

    // --- INTERNAL LOGIC & ALGORITHMS ---
    {
        "title": "Algoritma Dice Coefficient",
        "category": "Logic",
        "description": "Metode kalkulasi kemiripan string berbasis Bigram untuk fuzzy matching yang akurat.",
        "answer": "Kita pakai Dice Coefficient buat ngitung seberapa mirip ketikan kamu sama database kita. Lebih tahan typo dibanding Jaccard Index!",
        "url": "#",
        "keywords": ["dice", "coefficient", "fuzzy", "match", "kemiripan", "string", "bigram", "algoritma", "typo"]
    },
    {
        "title": "Contextual Boosting",
        "category": "Logic",
        "description": "Pemberian bobot tambahan pada hasil pencarian yang relevan dengan topik sebelumnya.",
        "answer": "Kalau topik sebelumnya lagi bahas 'iPhone', hasil pencarian terkait 'iPhone' bakal dapet skor tambahan (boosting) otomatis.",
        "url": "#",
        "keywords": ["boosting", "bonus", "skor", "bobot", "contextual", "prioritas", "relevansi"]
    },
    {
        "title": "Penalty System",
        "category": "Logic",
        "description": "Pengurangan skor untuk hasil yang kurang relevan atau mengandung kata kunci negatif.",
        "answer": "Ada sistem penalty juga kak. Hasil yang gak nyambung atau stoknya abis bakal dapet nilai minus biar tenggelam ke bawah.",
        "url": "#",
        "keywords": ["penalty", "hukuman", "minus", "skor", "filter", "relevansi", "penalti"]
    },
    {
        "title": "Indonesian Stemming (Sastrawi-lite)",
        "category": "Logic",
        "description": "Proses pencarian kata dasar untuk imbuhan Bahasa Indonesia (me-, di-, ke-, -kan, -nya).",
        "answer": "Sistem kita otomatis tau kalau 'membelikan' kata dasarnya 'beli', jadi pencarian lebih akurat biarpun pake imbuhan ribet.",
        "url": "#",
        "keywords": ["stemming", "kata dasar", "imbuhan", "bahasa", "indonesia", "sastrawi", "morphology"]
    },

    // --- CONFIGURATION & TYPES ---
    {
        "title": "AssistantConfig Interface",
        "category": "Config",
        "description": "Kontrak konfigurasi utama yang mencakup locale, debugMode, salesThreshold, dan triggers.",
        "answer": "AssistantConfig itu settingan utama bot. Isinya mulai dari bahasa, nomor WhatsApp, sampe aturan main deteksi promo.",
        "url": "#",
        "keywords": ["config", "interface", "setting", "pengaturan", "options", "parameter"]
    },
    {
        "title": "Schema Mapping (Custom Fields)",
        "category": "Config",
        "description": "Aliasing field database user agar sesuai dengan internal engine (misal: 'price' dipetakan ke 'harga').",
        "answer": "Gak perlu ubah nama field di database kamu. Cukup map aja pke 'schema' config, misal: { PRICE: 'harga_jual' }.",
        "url": "#",
        "keywords": ["schema", "mapping", "field", "database", "aliasing", "kolom", "kustom"]
    },
    {
        "title": "Reference Triggers",
        "category": "Config",
        "description": "Daftar kata pemicu (pronomina) yang memaksa engine mencari referensi dari history (misal: 'ada', 'itu', 'brp').",
        "answer": "Kamu bisa nambahin kata pemicu sendiri buat Context Engine biar bot makin peka sama pertanyaan nyambung.",
        "url": "#",
        "keywords": ["reference", "triggers", "pronomina", "pemicu", "rujukan", "kata ganti"]
    },
    {
        "title": "Type: AssistantDataItem",
        "category": "Types",
        "description": "Struktur data standar untuk item yang diindeks: title, description, content, keywords, dll.",
        "answer": "AssistantDataItem itu format data yang bot kita butuhin. Minimal ada title sama description biar bot bisa nyari.",
        "url": "#",
        "keywords": ["type", "data", "item", "interface", "struktur", "format", "object"]
    },

    // --- INTEGRATION & DEV-OPS ---
    {
        "title": "Environment Variables (.env)",
        "category": "Dev-Ops",
        "description": "Pengaturan sensitif dan variabel global seperti AIB_SECURITY_MAX_LENGTH atau AIB_SALES_HOT_THRESHOLD.",
        "answer": "Pakai .env buat simpen secret key atau atur threshold keamanan biar gak kecampur sama kode program.",
        "url": "#",
        "keywords": ["env", "environment", "secret", "variable", "variabel", "setting", "devops"]
    },
    {
        "title": "SecurityGuard (XSS/SQLi)",
        "category": "Security",
        "badge_text": "Critical",
        "description": "Module sanitasi input yang mencegah injeksi skrip berbahaya ke dalam engine.",
        "answer": "Bot kita aman dari serangan hacker kayak XSS atau SQL Injection karena setiap input selalu dibersihin dulu ama SecurityGuard.",
        "url": "#",
        "keywords": ["aman", "security", "xss", "inject", "hack", "proteksi", "sanitasi", "filter", "guard"]
    },
    {
        "title": "Structured Logger (Production)",
        "category": "Dev-Ops",
        "description": "Logging berbasis JSON untuk monitoring performa dan error di lingkungan production.",
        "answer": "Log aplikasi kita rapi banget pke format JSON, gampang di-track pke Datadog, ELK stack, atau Grafana.",
        "url": "#",
        "keywords": ["log", "logger", "json", "monitoring", "debug", "catatan", "produksi", "tracking"]
    },
    {
        "title": "Production Checklist",
        "category": "Deployment",
        "description": "Langkah wajib sebelum deploy: Set .env, hubungi Analytics, aktifkan Security Strict Mode.",
        "answer": "Wajib ikutin checklist kita sebelum live: setting limit query, aktifin strict mode, sama pasang analytics tracker.",
        "url": "#",
        "keywords": ["publish", "deploy", "production", "live", "rilis", "siap", "checklist", "go-live"]
    },

    // --- SALES & PSYCHOLOGY ---
    {
        "title": "Lead Scoring Engine",
        "category": "Sales",
        "badge_text": "Enterprise",
        "description": "Algoritma penilaian calon pembeli (Cold, Warm, Hot) berdasarkan urgensi dan intent.",
        "answer": "Bot bisa bedain mana orang yang cuma iseng nanya sama yang udah siap bayar (Hot Lead). Berguna banget buat tim sales kamu.",
        "url": "#",
        "keywords": ["lead", "scoring", "nilai", "hot", "sales", "konversi", "pembeli", "prospek", "jualan", "grade"]
    },
    {
        "title": "Sales Psychology Module",
        "category": "Sales",
        "description": "Pemberian respon adaptif berdasarkan trigger psikologis (Scarcity, Urgency, Authority).",
        "answer": "Bot kita jago jualan! Dia bisa kasih tekanan halus kayak 'Stok tinggal dikit' kalo kedeteksi user lagi ragu-ragu.",
        "url": "#",
        "keywords": ["psikologi", "psychology", "sales", "persuasi", "jualan", "scarcity", "urgency", "urgensi"]
    },
    {
        "title": "Budget Matcher",
        "category": "Sales",
        "description": "Otomatis mendeteksi budget user dari chat dan mencocokkan dengan produk yang tersedia.",
        "answer": "Budget Matcher bisa nangkep maksud 'budget 3 jutaan' dan langsung filter database buat cariin harga yang pas.",
        "url": "#",
        "keywords": ["budget", "harga", "cocok", "matcher", "duit", "uang", "pas", "kemampuan", "pembayaran"]
    },
    {
        "title": "Follow-Up Suggester",
        "category": "Sales",
        "description": "Memberikan saran pertanyaan lanjutan untuk membantu closing berdasarkan context.",
        "answer": "Suggester ini pinter kasih umpan balik, misal: 'Mau liat cicilannya?' kalo user barusan nanya harga.",
        "url": "#",
        "keywords": ["follow-up", "saran", "tanya", "closing", "bantuan", "lanjutan", "pertanyaan", "suggest"]
    },

    // --- ANALYTICS & TELEMETRY ---
    {
        "title": "Analytics Engine",
        "category": "Enterprise",
        "description": "Tracking event pencarian, klik hasil, dan konversi lead secara real-time.",
        "answer": "Pantau performa bot kamu pke Analytics Engine. Ketauan apa yang paling sering dicari user dan berapa lead yang masuk.",
        "url": "#",
        "keywords": ["analytics", "tracking", "pantau", "data", "event", "conversion", "konversi", "telemetry"]
    },
    {
        "title": "Search Transparency (HUD)",
        "category": "Dev Tools",
        "description": "Visualisasi breakdown skor dan performa pipa pencarian langsung di overlay browser.",
        "answer": "Liat daleman bot pke HUD! Bisa ketauan kenapa satu hasil dapet skor tinggi dan berapa milidetik bot mikir.",
        "url": "#",
        "keywords": ["hud", "transparency", "score", "breakdown", "debug", "visualisasi", "performa"]
    },

    // --- GLOBALIZATION ---
    {
        "title": "Language Providers",
        "category": "Core",
        "description": "Interface modular untuk mendukung berbagai bahasa (saat ini ID dan EN).",
        "answer": "Support multibahasa! Kamu bisa pake EnglishProvider atau IndonesianProvider, atau buat sendiri pke custom provider.",
        "url": "#",
        "keywords": ["language", "bahasa", "provider", "globalisasi", "multilingual", "internationalization", "i18n"]
    },
    {
        "title": "Indonesian NLP Core",
        "category": "NLP",
        "description": "Parser khusus Bahasa Indonesia untuk tanggal, angka/uang, dan deteksi sentimen.",
        "answer": "NLP kita aseli buatan lokal kak. Paham 'besok', '2.5jt', sampe sentimen kayak 'kecewa berat' atau 'gacor'.",
        "url": "#",
        "keywords": ["indo", "bahasa", "lokal", "indonesia", "slang", "uang", "tanggal", "nlp"]
    },

    // --- ADVANCED AI ---
    {
        "title": "Hybrid AI (LLM)",
        "category": "AI",
        "description": "Menghubungkan pencarian lokal dengan Model Bahasa Besar (LLM) untuk jawaban generatif.",
        "answer": "Bot bisa jadi super pinter kalo dihubungin ke OpenAI. Jawaban lokal digabung sama kecerdasan GPT buat hasil terbaik.",
        "url": "#",
        "keywords": ["hybrid", "ai", "llm", "gpt", "openai", "generative", "pintar", "cerdas"]
    },
    {
        "title": "Sentiment Analyzer",
        "category": "NLP",
        "description": "Mendeteksi tingkat emosi dan urgensi pelanggan secara real-time.",
        "answer": "Sentiment Analyzer bantu bot baper sebentar. Kalo kamu marah, dia bakal minta maaf. Kalo kamu seneng, dia ikutan asik.",
        "url": "#",
        "keywords": ["sentimen", "emosi", "analyzer", "perasaan", "mood", "feedback"]
    },

    // --- OTHERS & UTILS ---
    {
        "title": "Middleware Manager",
        "category": "Core",
        "description": "Mengelola pipeline interceptor untuk request dan response data.",
        "answer": "Pakai Middleware Manager buat nambahin logika custom di tengah jalan, kayak auto-translate atau filter stok.",
        "url": "#",
        "keywords": ["middleware", "manager", "pipeline", "interceptor", "hook", "logic"]
    },
    {
        "title": "SiteCrawler (Auto-Index)",
        "category": "Utils",
        "description": "Crawler otomatis yang memindai website kamu dan membangun index data AI secara instan.",
        "answer": "Gak mau input data manual? Pake SiteCrawler aja. Bot bakal keliling website kamu dan nyatet isinya otomatis.",
        "url": "#",
        "keywords": ["crawler", "spider", "auto-index", "pindai", "scan", "website", "otomatis"]
    },
    {
        "title": "UI Controller",
        "category": "Utils",
        "description": "Manajer tampilan chat yang mengatur animasi, typing indicator, dan interaksi user.",
        "answer": "UI Controller yang bikin tampilan chat kerasa smooth, ada animasi ngetik, sama popup yang cantik.",
        "url": "#",
        "keywords": ["ui", "controller", "tampilan", "animasi", "interaction", "interface", "chat"]
    },
    {
        "title": "Phonetic Similarity",
        "category": "Logic",
        "description": "Logika pencarian berdasarkan kemiripan bunyi (sound-alike) untuk menangani typo parah.",
        "answer": "Bot kita tetep tau maksud kamu biarpun tulisannya typo parah, berkat algoritma kemiripan bunyi.",
        "url": "#",
        "keywords": ["phonetic", "sound-alike", "kemiripan", "bunyi", "typo", "suara", "logic"]
    },
    {
        "title": "Entity Extraction",
        "category": "Logic",
        "description": "Proses menarik data kunci seperti harga, tanggal, atau nama produk dari kalimat bebas.",
        "answer": "Setiap kamu chat, bot langsung ambil info penting kayak 'besok' atau '100rb' buat diproses lebih lanjut.",
        "url": "#",
        "keywords": ["entity", "extraction", "ekstraksi", "entitas", "info", "key", "data"]
    },
    {
        "title": "Semantic Aliasing",
        "category": "Logic",
        "description": "Pemetaan kata-kata yang berbeda namun memiliki makna serupa (misal: 'murah' = 'hemat').",
        "answer": "Bot kita tau kalo 'murah', 'hemat', sama 'terjangkau' itu intinya sama. Jadi hasil pencariannya tetep akurat.",
        "url": "#",
        "keywords": ["semantic", "aliasing", "sinonim", "makna", "sama", "arti", "keyword"]
    },
    {
        "title": "Search Transparency Score",
        "category": "Logic",
        "description": "Breakdown skor numerik yang menjelaskan mengapa suatu hasil dianggap relevan.",
        "answer": "Penasaran kok ini yang muncul? Cek transparency score-nya. Ada bobot buat judul, deskripsi, sampe context.",
        "url": "#",
        "keywords": ["transparency", "score", "breakdown", "numerik", "bobot", "relevansi", "nomer"]
    },
    {
        "title": "Adaptive Response Prefix",
        "category": "NLP",
        "description": "Penambahan awalan kalimat yang menyesuaikan dengan sentimen user (misal: 'Mohon maaf' untuk sentimen negatif).",
        "answer": "Bot otomatis nambahin awalan ramah kayak 'Duh maaf ya' kalo kedeteksi user lagi kecewa.",
        "url": "#",
        "keywords": ["prefix", "adaptive", "awalan", "kalimat", "sentimen", "ramah", "simpati"]
    },
    {
        "title": "Telemetri Performa",
        "category": "Dev-Ops",
        "description": "Data durasi eksekusi tiap pipa (Preprocessing, Search, Scoring) untuk optimasi kecepatan.",
        "answer": "Kita pantau terus tiap milidetik bot mikir. Kalo ada yang lambat, langsung ketauan di data telemetri.",
        "url": "#",
        "keywords": ["telemetri", "performa", "durasi", "kecepatan", "ms", "milidetik", "eksekusi", "latency"]
    },
    {
        "title": "Sistem Caching History",
        "category": "Core",
        "description": "Penyimpanan riwayat percakapan singkat untuk mendukung resolusi referensi yang cepat.",
        "answer": "Bot simpen chat terakhir kamu di cache biar kalo kamu tanya pertanyaan nyambung, responnya kilat (Memory System).",
        "url": "#",
        "keywords": ["caching", "cache", "history", "riwayat", "kilat", "cepat", "performa", "memori", "memory"]
    },
    {
        "title": "Session Management & Timeout",
        "category": "Dev-Ops",
        "description": "Pengaturan durasi sesi user di memori sebelum dibersihkan (AIB_SESSION_TIMEOUT_MIN).",
        "answer": "Kita punya sistem session timeout. Kamu bisa atur berapa lama bot 'inget' user lewat env AIB_SESSION_TIMEOUT_MIN.",
        "url": "#",
        "keywords": ["session", "sesi", "timeout", "durasi", "expired", "kadaluarsa", "bersih", "memory", "memori"]
    },
    {
        "title": "State Persistence",
        "category": "Architecture",
        "description": "Kemampuan bot untuk menyimpan status percakapan (state) ke storage eksternal atau database.",
        "answer": "Memori bot gak cuma di RAM kak, bisa di-save ke database eksternal supaya biarpun server restart, bot tetep 'inget' kamu.",
        "url": "#",
        "keywords": ["persistence", "simpan", "database", "state", "status", "restart", "permanent", "memory", "memori"]
    },
    {
        "title": "Memory Cleanup (TTL)",
        "category": "Logic",
        "description": "Logika pembersihan otomatis data lama untuk menjaga performa server tetap ringan.",
        "answer": "Gak usah takut server lemot, ada fitur Cleanup otomatis (TTL) yang bakal hapus memori chat yang udah lama gak aktif.",
        "url": "#",
        "keywords": ["cleanup", "ttl", "hapus", "otomatis", "ringan", "performa", "ram", "memory", "memori"]
    },
    {
        "title": "Handling Negatif & Keluhan",
        "category": "Customer Care",
        "description": "Logika khusus saat mendeteksi sentimen negatif (kecewa, marah, lambat).",
        "answer": "Sistem kita peka banget kak. Kalo kamu lagi kesel, bot otomatis bakal lebih kalem dan minta maaf duluan sebelum jawab pertanyaan kamu.",
        "url": "#",
        "keywords": ["keluhan", "komplain", "marah", "kecewa", "jelek", "lambat", "buruk", "negatif", "handling", "care", "cs"]
    },
    {
        "title": "Empathy Logic (Objection Prefix)",
        "category": "NLP",
        "description": "Pemberian awalan kalimat yang empatik secara otomatis saat user sedang dalam emosi negatif.",
        "answer": "Ada Empathy Logic kak. Bot gak bakal robotik kalo kamu lagi emosi; dia bakal pake prefix kayak 'Kami mengerti kekhawatiran Anda' biar lebih manusiawi.",
        "url": "#",
        "keywords": ["empathy", "empati", "manusiawi", "kalem", "perasaan", "emosi", "negatif", "prefix", "objection"]
    },
    {
        "title": "Handling Positif & Apresiasi",
        "category": "Customer Care",
        "description": "Logika penguaran respon saat mendeteksi sentimen positif (puas, senang, gacor).",
        "answer": "Bot kita juga bisa ikut seneng! Kalo kamu kasih feedback positif, bot bakal bales dengan nada yang lebih semangat dan apresiatif.",
        "url": "#",
        "keywords": ["puas", "senang", "mantap", "gacor", "bagus", "keren", "hebat", "positif", "apresiasi", "terima kasih"]
    },
    {
        "title": "Excitement Detection",
        "category": "NLP",
        "description": "Mendeteksi tingkat kegembiraan user melalui tanda seru, capslock, dan kata-kata positif intensitas tinggi.",
        "answer": "Bot paham kalo kamu lagi semangat! Dia bisa deteksi 'high intensity positive sentiment' supaya jawabannya makin asik.",
        "url": "#",
        "keywords": ["semangat", "seru", "capslock", "asik", "banget", "intensitas", "gembira"]
    }
];