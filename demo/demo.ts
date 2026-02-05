import { AssistantEngine } from '../src/engine';
import type { AssistantDataItem, AssistantConfig } from '../src/types';

const mockDocData: AssistantDataItem[] = [
    {
        title: "Arsitektur Umum",
        category: "Architecture",
        description: "Framework enterprise modular yang terdiri dari Engine Layer dan Sales Intelligence.",
        keywords: ["struktur", "layer", "modular"],
        url: "/docs/architecture"
    },
    {
        title: "Server-Side Integration",
        category: "Integration",
        description: "Library ini 100% Server-Side Ready untuk Node.js.",
        keywords: ["node", "backend", "server"],
        url: "/docs/server-side"
    },
    {
        title: "Lead Scoring",
        category: "Sales",
        badge_text: "Hot Feature",
        description: "Menilai user berdasarkan intent dan urgensi.",
        keywords: ["scoring", "sales", "hot"],
        url: "/docs/sales-modules"
    }
];

const config: AssistantConfig = {
    whatsappNumber: "62812345678",
    salesTriggers: {
        'beli': ['order', 'pakai', 'implementasi'],
        'harga': ['biaya', 'tarif', 'lisensi']
    },
    sentimentPrefixes: {
        negative: ["Mohon maaf kak, kami bantu cek dokumentasinya.", "Aduh, maaf ya."],
        positive: ["Senang mendengarnya! ", "Asik! "]
    }
};

const engine = new AssistantEngine(mockDocData, undefined, config);

(async () => {
    console.log("--- Query 1: 'apa itu arsitektur modular?' (Context: Architecture) ---");
    const res1 = await engine.search("apa itu arsitektur modular?");
    console.log("Intent:", res1.intent);
    console.log("Top Result:", res1.results[0]?.title);
    console.log("Confidence:", res1.confidence);

    console.log("\n--- Query 2: 'bagaimana cara pakai di nodejs?' (Context: Integration) ---");
    const res2 = await engine.search("bagaimana cara pakai di nodejs?");
    console.log("Intent:", res2.intent);
    console.log("Top Result:", res2.results[0]?.title);

    console.log("\n--- Query 3: 'mau implementasi Lead Scoring' (Sales Intent: Beli) ---");
    const res3 = await engine.search("mau implementasi Lead Scoring");
    console.log("Intent:", res3.intent);
    console.log("Aggregated Answer:", res3.answer);

    console.log("\n--- Test 4: Sentiment Awareness (Negative) ---");
    const res4 = await engine.search("dokumentasinya membingungkan saya kecewa");
    console.log("Intent:", res4.intent);
    console.log("Answer with Prefix:", res4.answer?.substring(0, 50) + "...");

    console.log("\n--- Query 5: 'berapa biaya lisensinya?' (Sales Intent: Harga) ---");
    const res5 = await engine.search("berapa biaya lisensinya?");
    console.log("Intent:", res5.intent);
    console.log("Result:", res5.results[0]?.title);
})();
