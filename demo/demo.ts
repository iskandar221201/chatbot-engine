import { AssistantEngine } from '../src/engine';
import type { AssistantDataItem, AssistantConfig } from '../src/types';

const mockData: AssistantDataItem[] = [
    {
        title: "Iphone 15 Pro",
        category: "Electronics",
        price_numeric: 15000000,
        sale_price: 13500000,
        badge_text: "Hot Deal",
        description: "Latest apple phone",
        keywords: ["phone", "mobile"],
        url: "/iphone-15"
    },
    {
        title: "Samsung Galaxy S24",
        category: "Electronics",
        price_numeric: 12000000,
        description: "Android flagship",
        keywords: ["android"],
        url: "/s24"
    }
];

const config: AssistantConfig = {
    whatsappNumber: "62812345678",
    salesTriggers: {
        'beli': ['order', 'pesan']
    },
    // NEW: Fully Configurable Enterprise Modules
    salesReporter: {
        currencySymbol: 'USD',
        avgOrderValue: 500, // Custom business assumption
    },
    nlp: {
        useClassifier: true,
        trainingData: {
            'custom.intent': ['trigger custom', 'my custom intent']
        }
    },
    hybridAI: {
        apiKey: 'mock-key', // Using mock key for demo
        model: 'gpt-3.5-turbo',
        apiUrl: 'http://localhost:1234/v1/chat/completions' // Example local LLM endpoint
    },
    sentimentPrefixes: {
        negative: ["Waduh, maaf ya kak.", "Sabar ya kak, kami bantu cek."],
        positive: ["Yeay! ", "Asik! "]
    }
};

const engine = new AssistantEngine(mockData, undefined, config);

(async () => {
    console.log("--- Query 1: 'berapa harga iphone?' (Sales Intent: Harga) ---");
    const res1 = await engine.search("berapa harga iphone?");
    console.log("Intent:", res1.intent);
    console.log("Top Result:", res1.results[0]?.title);
    console.log("Confidence:", res1.confidence);

    console.log("\n--- Query 2: 'mau pesan yang promo' (Sales Intent: Beli + Promo) ---");
    const res2 = await engine.search("mau pesan yang promo");
    console.log("Intent:", res2.intent);
    console.log("Top Result (should be the one with badge/sale):", res2.results[0]?.title);
    console.log("Badge:", res2.results[0]?.badge_text);

    console.log("\n--- Query 3: 'berapa harga iphone trus fiturnya apa?' (Compound Query) ---");
    const res3 = await engine.search("berapa harga iphone trus fiturnya apa?");
    console.log("Intent:", res3.intent);
    console.log("Aggregated Answer:", res3.answer);

    console.log("\n--- Test 4: Custom Schema Verification ---");
    const customConfig: AssistantConfig = {
        ...config,
        schema: {
            PRICE: 'price_val',
            FEATURES: 'specs'
        }
    };
    const customEngine = new AssistantEngine(mockData, undefined, customConfig);
    const res4 = await customEngine.search("harga iphone");
    console.log("Custom Schema Search Result:", res4.results[0]?.title);

    console.log("\n--- Query 5: 'mau kontak' (Should be chat_contact, not sales_beli) ---");
    const res5 = await engine.search("mau kontak");
    console.log("Intent:", res5.intent);
    console.log("Expected: chat_contact, Actual:", res5.intent);
})();
