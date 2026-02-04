import { AssistantEngine } from './src/engine';
import type { AssistantDataItem, AssistantConfig } from './src/types';

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
})();
