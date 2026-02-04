# Assistant-in-a-Box: Dokumentasi Teknis 📚

[🇺🇸 English Version](file:///c:/Users/USER/Pictures/a/landingpages/library/chatbot-engine/DOCUMENTATION_EN.md)

Panduan lengkap mengenai Enterprise Sales-Driven Chatbot Engine.

---

## 1. Arsitektur Umum

The library is a modular enterprise framework:

- **Type System (`src/types.ts`)**: Core data structures.
- **Engine Layer (`src/engine.ts`)**: Fuzzy logic, NLP scoring, and intent detection.
- **Sales Intelligence (`src/lib/lead-scoring.ts`, `src/lib/sales-psychology.ts`)**: Modules for scoring and psychology.
- **Enterprise Layer (`src/lib/analytics.ts`, `src/lib/sentiment.ts`)**: Telemetry, emotion detection, and logic.
- **Sub-Engines (`src/lib/...`)**: Modular units for specific logic (ContextEngine, IntentOrchestrator, ResponseEngine, PreprocessingEngine, ScoringEngine, QueryOrchestrator, SecurityGuard).
- **Core Libs (`src/lib/middleware.ts`, `src/lib/logger.ts`)**: Extensibility and observability.

---

## 2. Server-Side Integration (Node.js) 🆕

Library ini sekarang **100% Server-Side Ready** (Node.js/Bun/Deno).

### Konfigurasi via Environment Variables
Buat file `.env` di root project Anda:

```bash
# Security
AIB_SECURITY_MAX_LENGTH=1000
AIB_SECURITY_STRICT_MODE=true

# Sales Intelligence
AIB_SALES_HOT_THRESHOLD=75
AIB_SALES_WEIGHT_INTENT=35

# Performance
AIB_SESSION_TIMEOUT_MIN=60
```

Load konfigurasi di aplikasi Anda:
```typescript
import { AssistantEngine, ConfigLoader } from 'assistant-in-a-box';

const config = ConfigLoader.loadFromEnv();
const engine = new AssistantEngine(data, Fuse, config);
```

---

## 3. Sales-Driven Modules 💰

Fitur utama untuk meningkatkan konversi penjualan.

### A. Lead Scoring
Menilai user berdasarkan intent (beli/tanya), urgensi (capslock/tanda seru), dan engagement.

```typescript
import { LeadScoring } from 'assistant-in-a-box';
const scorer = new LeadScoring();
const result = scorer.score('mau order sekarang dong, urgent!');

// result.grade -> 'hot'
// result.score -> 85
```

### B. Budget Matcher
Otomatis mendeteksi budget user dan mencocokkan produk.

```typescript
import { BudgetMatcher } from 'assistant-in-a-box';
const matcher = new BudgetMatcher();
const matches = matcher.match('cari hp budget 3 jutaan', productList);

// matches.suggestion -> "Ada 3 produk yang pas dengan budget 3jt..."
```

### C. Follow-Up Suggester
Memberikan saran pertanyaan lanjutan untuk membantu closing.

```typescript
import { FollowUpSuggester } from 'assistant-in-a-box';
const suggester = new FollowUpSuggester();
const questions = suggester.suggest('sales_harga');
// -> ["Apakah budget ini sudah fix?", "Mau info cicilan?"]
```

---

## 4. Enterprise Features 🏢

### A. Middleware Pipeline (Interceptor)
Intercept request/response untuk custom logic (seperti Express.js).

```typescript
import { MiddlewareManager } from 'assistant-in-a-box';
const mw = new MiddlewareManager();

// Middleware: Auto-Translate Query
mw.useRequest(async (ctx, next) => {
    ctx.query = await translateToIndonesian(ctx.query);
    await next();
});

// Middleware: Filter Out of Stock Results
mw.useResponse(async (result, ctx, next) => {
    result.results = result.results.filter(item => item.stock > 0);
    await next();
});
```

### B. Analytics & Telemetry
Hook data event ke Google Analytics atau Datadog.

```typescript
import { AnalyticsEngine } from 'assistant-in-a-box';
const analytics = new AnalyticsEngine();

analytics.onEvent((event) => {
    console.log(`[${event.type}]`, event.payload);
    // Kirim ke external API
});
```

### C. SecurityGuard
Proteksi input dari serangan XSS dan SQL Injection sederhana. Engine menggunakan modul ini secara otomatis pada setiap request sebelum proses pencarian dilakukan.

```typescript
import { SecurityGuard } from 'assistant-in-a-box';

// Sanitasi Input Manual
const safeQuery = SecurityGuard.clean('<script>alert(1)</script> Hello'); // -> " Hello"

// Konfigurasi via Engine
const engine = new AssistantEngine(data, undefined, {
    security: {
        maxLength: 500,
        strictMode: true // Reject request jika terdeteksi ancaman
    }
});
```

### D. Structured Logger
Logging JSON standar untuk production.

```typescript
import { logger } from 'assistant-in-a-box';
logger.info('Search performed', { query: 'iphone', userId: '123' });
```

### E. Sentiment Analysis Config 🎭
Custom dictionary untuk mendeteksi emosi sesuai industri Anda.

```typescript
import { SentimentAnalyzer } from 'assistant-in-a-box';

const analyzer = new SentimentAnalyzer({
    positiveWords: { 'gacor': 3, 'manjur': 2 }, // Custom slang
    negativeWords: { 'zonk': 3, 'lemot': 2 },
    urgencyWords: ['darurat', 'kebakaran jenggot']
});

const result = analyzer.analyze('Barangnya gacor parah!'); 
// -> Score positif tinggi
```

### F. Sales Reporter Config 📊
Sesuaikan asumsi pendapatan dan mapping intent.

```typescript
import { SalesReporter } from 'assistant-in-a-box';

const reporter = new SalesReporter(analyticsEngine, {
    currencySymbol: 'USD',
    avgOrderValue: 50, // Nilai rata-rata order $50
    leadConversionRate: 0.2 // Asumsi 20% lead closing
});

console.log(reporter.getHtmlSummary());
```

### G. Sentiment-Aware & Adaptive Response 🎭
Bot akan menyesuaikan nada bicara berdasarkan emosi pelanggan (Positive/Negative).

```typescript
const engine = new AssistantEngine(data, undefined, {
    sentiment: {
        positiveWords: { 'gacor': 3 },
        negativeWords: { 'kecewa': 3 }
    },
    sentimentPrefixes: {
        negative: ["Mohon maaf kak.", "Aduh, maaf ya."],
        positive: ["Wah, asik! ", "Senang mendengarnya! "]
    }
});
```
> [!TIP]
> Jika sentimen terdeteksi **negative**, engine akan otomatis menyisipkan *Objection Prefix* simpatik sebelum memberikan jawaban untuk meredam kekhawatiran pelanggan.


### H. Intent Orchestration (IntentOrchestrator) 🧠
Semua deteksi intent dikelola oleh `IntentOrchestrator` yang menggabungkan AI (NLP Classifier) dengan Rule-based triggers secara hierarkis.

```typescript
import { IntentOrchestrator } from 'assistant-in-a-box';

const orchestrator = new IntentOrchestrator({
    threshold: 0.8, // Strictness AI
    salesTriggers: { 'custom': ['pesan khusus'] }
});

// Digunakan secara internal oleh Engine, namun bisa diakses:
const intent = engine.intentOrchestrator.detect(query, tokens, stemmedTokens);
```

### I. Hybrid AI (LLM) Config 🤖
Hubungkan dengan OpenAI atau model lain (compatible endpoint).

```typescript
import { HybridAI } from 'assistant-in-a-box';

const ai = new HybridAI({
    apiKey: 'sk-xxx',
    model: 'gpt-4',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    systemPrompt: 'Kamu adalah CS toko sepatu yang gaul.'
});
```

### J. Smart Reference Resolution (ContextEngine) 🧠
Engine menggunakan `ContextEngine` sub-engine untuk memahami pertanyaan lanjutan tanpa menyebutkan subjeknya lagi (misal: "harganya berapa?").

```typescript
// Akses langsung ke sub-engine
const engine = new AssistantEngine(data);
const currentState = engine.context.getState(); 

// Konfigurasi via Engine
const engineWithRef = new AssistantEngine(data, undefined, {
    // Kata kunci yang memicu resolusi subjek dari history
    referenceTriggers: ['berapa', 'harganya', 'stok', 'fitur', 'warna']
});
```
> [!TIP]
> **Entity Locking**: Jika engine menemukan hasil dengan kepercayaan tinggi (>80%), sub-engine akan "mengunci" subjek tersebut untuk referensi percakapan berikutnya sampai user mengganti topik secara eksplisit.


### K. Relevancy & Ranking (ScoringEngine) ⚖️
Logika penilaian hasil pencarian (Dice Coefficient, weighting, contextual boosting) dikelola oleh `ScoringEngine`. Ini memungkinkan penggantian algoritma perankingan tanpa mengubah alur pencarian.

### L. Search Transparency (Scoring Breakdown) 🔍
Setiap hasil pencarian kini menyertakan `scoreBreakdown` yang menjelaskan bobot penilaian:

```typescript
const result = await engine.search("samsung galaxy");
console.log(result.scoreBreakdown);
/* Output:
{
  fuzzyMatch: 9,
  tokenMatch: 25,
  fieldBoost: 50,
  contextBoost: 0,
  psychologyBoost: 30,
  intentBoost: 20,
  penalty: 0
}
*/
```

### M. Performance Optimization (Memoization) ⚡
`PreprocessingEngine` secara otomatis melakukan *memoization* (caching) pada proses *stemming* bahasa Indonesia. Hal ini mengurangi beban CPU secara signifikan saat menangani query berulang atau teks yang panjang.

### N. Globalisasi & Custom Language Providers 🌍
Anda bisa mengganti logika linguistik (stemming/stopwords) dengan mudah:

```typescript
const engine = new AssistantEngine(data, undefined, { 
    locale: 'en' // Otomatis menggunakan EnglishProvider
});

// Atau gunakan Provider Custom:
const engineCustom = new AssistantEngine(data, undefined, {
    prepro: {
        languageProvider: new MyFrenchProvider()
    }
});
```

### O. Observability: Diagnostic Tracer 🕵️‍♂️
Setiap hasil pencarian kini membawa data `diagnostics` untuk membantu debugging performa dan logika:

```typescript
const result = await engine.search("iphone murah");
console.log(result.diagnostics);
/* Output:
[
  { id: 'security_check', duration: 0.2, meta: { isValid: true } },
  { id: 'preprocessing', duration: 1.5, meta: { tokenCount: 2 } },
  { id: 'scoring', duration: 3.2, meta: { finalCandidateCount: 15 } }
]
*/
```


---

## 5. Indonesian NLP Core 🇮🇩

Library ini memiliki parser khusus Bahasa Indonesia bawaan.

### Date Parser
Mengerti ekspresi waktu natural.
- "Besok" -> Date object (H+1)
- "Minggu depan" -> Date object (H+7)
- "Tanggal 15" -> Date object (Tanggal 15 bulan ini)

### Number Parser
Mengerti format uang Indonesia.
- "2.5jt" -> 2500000
- "500rb" -> 500000
- "seratus ribu" -> 100000

### Sentiment Analyzer
Mendeteksi emosi dan urgensi pelanggan.
- "Kecewa berat!!" -> Negative + Urgent
- "Bagus banget" -> Positive + High Intensity

---

## 6. Integrasi Frontend (Legacy)

Untuk penggunaan di browser (non-Node.js), fitur UI Controller dan Crawler masih tersedia seperti versi sebelumnya.

### Quick Start (Browser)
```html
<script src="dist/index.global.js"></script>
<script>
    const app = new Assistant.AssistantController(data);
    app.openAssistant();
</script>
```

Lihat bagian [Quick Start V1](#) di dokumentasi lama untuk detail UI customization.

---

## 7. Production Checklist 🚀

1. [ ] **Environment**: Set `.env` untuk konfigurasi threshold sales & security.
2. [ ] **Telemetry**: Pastikan `AnalyticsEngine` terhubung ke dashboard monitoring Anda.
3. [ ] **Security**: Aktifkan `AIB_SECURITY_STRICT_MODE` di server production.
4. [ ] **Caching**: Gunakan `CacheManager` jika traffic tinggi.
5. [ ] **Minify**: Gunakan build `dist/index.js` (CJS) atau `dist/index.mjs` (ESM).
