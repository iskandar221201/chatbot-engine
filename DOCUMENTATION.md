# Assistant-in-a-Box: Technical Documentation 📚

This guide provides a comprehensive overview of how to configure and deploy the generic Assistant library for any landing page.

---

## 1. Architecture Overview

The library is organized within the `src/` directory:

- **Type System (`src/types.ts`)**: Defines the data structures for search items, results, and configuration.
- **Engine Layer (`src/engine.ts`)**: Handles the "intelligence" – query preprocessing, **Indonesian stemming**, phonetic auto-correct, semantic expansion, and **Dice Coefficient** scoring.
- **Controller Layer (`src/controller.ts`)**: Manages the Chat UI, DOM events, and session persistence.
- **Internal Libs (`src/lib/`)**: Contains bundled dependencies like `fuse.js`.

---

## 2. Quick Start (Demo)

Untuk melihat chatbot beraksi secara instan, buka folder `demo/`:

1. Buka `demo/index.html` di browser Anda.
2. Edit `demo/sample-data.js` untuk mengganti data produk.
3. Edit `demo/assistant-config.js` untuk mengatur trigger penjualan dan NLP.

> [!NOTE]
> Demo menggunakan format `.js` bukan `.json` agar bisa dijalankan langsung dari file sistem (tanpa perlu web server) tanpa terkena blokir CORS.

---

## 3. Setting Up the Data (JSON/JS)

Your `data.json` must follow the `AssistantDataItem` interface.

```json
[
  {
    "title": "Example Title",
    "description": "Longer description for reference.",
    "answer": "The specific short answer shown in the chat bubble.",
    "url": "/link-to-page#section",
    "category": "CategoryName",
    "keywords": ["key1", "key2"],
    "price_numeric": 1500000,
    "sale_price": 1200000,
    "badge_text": "Hot Deal",
    "cta_label": "Beli Sekarang",
    "cta_url": "https://wa.me/xxx",
    "image_url": "https://...",
    "is_recommended": true
  }
]
```

### 💰 Sales-Driven Mode (Core Feature)
Chatbot ini dirancang untuk memaksimalkan konversi secara otomatis. 

- **Automatic Recognition**: Mengenali maksud "beli", "harga", "promo" secara cerdas (Indonesian & English).
- **Universal Triggers**: Bisa dikonfigurasi untuk bahasa lain (Arab, Mandarin, etc) lewat `salesTriggers`.
- **Dynamic Badges**: Otomatis menampilkan tag **"Rekomendasi"** atau **"Hot Deal"** (dari `badge_text`).
- **High-Conversion UI**: Menampilkan perbandingan harga (diskon) dan tombol **"Pesan Sekarang"** yang menonjol.
- **Compound Intelligence (New)**: Mampu memproses kalimat majemuk/berantai. Jika user bertanya "harga produk A trus fiturnya apa", engine akan memilahnya menjadi dua sub-query namun tetap menjaga konteks produk A.


#### 🛠️ Customizing Sales Triggers
Jika landing page Anda menggunakan bahasa selain Indo/Inggris, tambahkan keyword baru:
```typescript
const config = {
    salesTriggers: {
        'beli': ['اشتري', 'order'], // Arabic + custom
        'harga': ['كم السعر', 'budget'],
        'promo': ['voucher', 'kode']
    }
};
```

---

## 3. Advanced Configuration

The `AssistantConfig` object allows you to customize the assistant's behavior for any industry.

### 🧩 Phonetic Mapping
Maps common user typos to correct keywords.
```typescript
phoneticMap: {
    "product": ["priduct", "prudukt", "prodak"],
    "location": ["locatin", "lokasi", "alamat"]
}
```

### 🧠 Semantic Expansion
Expands a single term into multiple synonyms for broader search coverage.
```typescript
semanticMap: {
    "price": ["cost", "budget", "billing", "how much"],
    "contact": ["help", "support", "call", "whatsapp"]
}
```

### 🔍 Entity Definitions
Identifies specific "concepts" in the query to trigger special logic.
```typescript
entityDefinitions: {
    "isPremium": ["vip", "luxury", "elite"],
    "isDiscount": ["promo", "cheap", "sale"]
}
```

### 🎯 Intent Rules
Fitur paling powerful untuk mengarahkan user. Memaksa engine memprioritaskan kategori tertentu berdasarkan kata kunci atau entity yang terdeteksi.
```typescript
intentRules: [
    {
        intent: "layanan_premium",
        conditions: {
            tokens: ["vip", "luxury", "eksklusif"],
            entities: ["isPremium"]
        }
    }
]
```

### 🌐 Hybrid Mode (Local vs Server)
Anda bisa memilih untuk menjalankan pencarian secara lokal (Client-side) atau melalui API (Server-side).

```typescript
searchMode: 'remote', // Default: 'local'
apiUrl: [
    'https://api.laravel-app.com/search',
    'https://api.codeigniter-app.com/search'
] // Bisa string tunggal atau Array of URLs
```
> [!NOTE]
> Jika menggunakan banyak URL, results akan digabung dan diranking ulang secara otomatis sesuai relevansi.

### 🔒 Keamanan Produksi (Rekomendasi)
Untuk keamanan maksimal agar API Key **tidak terekspos sama sekali** di browser, gunakan pattern **"Server-Side Proxy"**:

1. **Browser** memanggil script PHP di domain yang sama (Tanpa API Key).
2. **Script PHP** bertindak sebagai perantara yang menempelkan API Key dan memanggil API tujuan.

#### Konfigurasi di Browser (Aman):
```typescript
const config = {
    searchMode: 'remote',
    apiUrl: '/api/assistant-proxy.php' // Panggil file lokal Anda sendiri
    // Tidak butuh apiHeaders di sini!
};
```

### 🔀 Compound Query Configuration
Konfigurasi bagaimana bot memisahkan kalimat majemuk:
```typescript
conjunctions: ['trus', 'dan', 'lalu', 'plus'], // Daftar kata sambung (Array)
// ATAU gunakan Regex kustom:
// conjunctions: /\s+(?:kemudian|setelah\s+itu)\s+/gi
```

### 🏷️ Attribute Label Customization
Ubah tampilan nama atribut tanpa merubah data asli:
```typescript
attributeLabels: {
    'harga': 'Investasi',
    'garansi': 'Jaminan Layanan',
    'kapasitas': 'Daya Tampung'
}
```

### 🏗️ Internal Schema Configuration (New)
Jika data Anda menggunakan kunci internal yang berbeda atau Anda ingin melokalisasi kunci mapping atribut:
```typescript
schema: {
    PRICE: 'harga',
    PRICE_PROMO: 'harga_promo',
    BADGE: 'badge',
    RECOMMENDED: 'direkomendasikan',
    FEATURES: 'fitur',
    RATING: 'rating',
    WARRANTY: 'garansi'
}
```

### 📋 Feature Extraction Patterns
Anda bisa menentukan bagaimana engine mengekstrak fitur/kelebihan dari deskripsi produk:
```typescript
featurePatterns: [
    /(?:fitur|feature|keunggulan)[:\s]*([^.]+)/gi,
    /(?:•|✓)([^•✓\n]+)/g
]
```


#### Isi file `assistant-proxy.php` (Server-side):
```php
<?php
// 1. Verifikasi asal request (CORS)
header("Access-Control-Allow-Origin: https://toko-anda.com");

// 2. Ambil query dari browser
$query = $_GET['q'] ?? '';

// 3. Panggil API asli dengan SECRET KEY di sisi server
$apiUrl = "https://api.internal-search.com/v1?q=" . urlencode($query);
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-Key: SUPER_SECRET_KEY_ANDA" // Kunci ini AMAN di server
]);

$response = curl_exec($ch);
echo $response; // Kirim balik hasil ke chatbot
```

> [!TIP]
> **Kesimpulan**: Gunakan `apiHeaders` hanya untuk kebutuhan testing atau internal. Untuk website live/produksi, selalu gunakan **Server-Side Proxy** di atas agar data dan kunci Anda tetap privat.

---

## 4. Scoring & Ranking Mechanism ⚖️

Engine ini menggunakan sistem **Composite Scoring** (Fuzzy + NLP + Business Logic).

### Komponen Skor Utama:
1. **Fuzzy Base (Fuse.js)**: Pencarian awal berbasis *approximate string matching*.
2. **Dice Coefficient (NLP Layer)**: Mengukur kemiripan bigram antar kata. Sangat efektif untuk menangkap kecocokan bagian kalimat meskipun ada sedikit typo.
3. **Indonesian Stemmer (SastrawiJs built-in)**: Menggunakan algoritma **Nazief & Adriani** yang sangat akurat untuk mengubah kata berimbuhan menjadi kata dasar (misal: "perekonomian" -> "ekonomi", "keberangkatan" -> "berangkat") secara otomatis.
4. **Punctuation Signals**:
   - **Question Mark (`?`)**: Memberikan **Inquiry Boost** (+15 pts) untuk item yang memiliki kolom `answer`.
   - **Exclamation Mark (`!`)**: Memberikan **Urgency Boost** (+10 pts) untuk meningkatkan visibilitas hasil.
5. **Weighted Match**:
   - **Title Match**: Bobot paling tinggi (+20 pts).
   - **Dice Phrase Bonus**: Bonus hingga +40 pts jika seluruh query memiliki kemiripan tinggi dengan judul.
   - **Sequential Bonus**: Bonus jika kata kunci muncul berurutan.

### Sales-Driven Boost:
- **Recommended Item**: +25 pts.
- **Sales Intent (Beli/Harga/Promo)**: +30 pts jika item memiliki harga.
- **Product Badge**: +15 pts.

---

## 5. UI Implementation

### Selectors
Define the IDs of your HTML elements in a `selectors` object:
```typescript
const selectors = {
    overlayId: "search-overlay",
    inputId: "search-input",
    sendBtnId: "send-btn",
    closeBtnId: "close-search",
    chatContainerId: "chat-container",
    messagesListId: "messages-list",
    typingIndicatorId: "typing-indicator",
    quickLinksClass: "quick-link-chip", // CSS Class
    welcomeMsgClass: "assistant-bubble" // CSS Class
};
```

### Initialization
```typescript
import { AssistantController } from "./index"; // Or from your main entry point

// Fuse.js is now internal, you don't need to pass it anymore!
const app = new AssistantController(myData, undefined, selectors, config);
app.openAssistant();
```

### Async Search Support
Pencarian sekarang bersifat asynchronous. Jika Anda menggunakan `AssistantEngine` secara langsung:
```typescript
const result = await engine.search("permintaan user");
```

---

## 5. Session Persistence
The library automatically saves chat history to `localStorage` under the key `assistant_chat_history`. It will automatically re-render the history upon initialization.

To clear history programmatically:
```typescript
// Exposed to window via controller
window.clearSearchHistory();
```

---

## 7. Production Checklist 🚀

1. [ ] **Minify Bundle**: Jalankan `npm run build` untuk mendapatkan file `index.global.js` yang terkompresi.
2. [ ] **Config Externalization**: Pastikan `assistant-config.js` sudah sesuai dengan branding & keyword produk Anda.
3. [ ] **Validation**: Jalankan `npm test` untuk memastikan semua logic core berjalan normal.
4. [ ] **Remote Mode (Optional)**: Jika data produk > 1.000, siapkan backend API dan gunakan `searchMode: 'remote'`.
5. [ ] **Security**: Gunakan **Server-Side Proxy** jika Anda memanggil external API yang membutuhkan API Key.
6. [ ] **Mobile Touch**: Pastikan CSS `style.css` memberikan area sentuh yang cukup besar untuk tombol input & send.

