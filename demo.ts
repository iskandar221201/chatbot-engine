
import { CoreEngine } from './src/CoreEngine';
import type { AIConfig, SearchDataItem } from './src/types';

// Mock Fuse class for demo
class MockFuse {
    private data: any[];
    constructor(data: any[]) { this.data = data; }
    search(q: string) {
        const terms = q.toLowerCase().split(' ');
        return this.data
            .filter(item => terms.some(t => item.title.toLowerCase().includes(t) || item.keywords?.includes(t)))
            .map(item => ({ item, score: 0.1 })); // Fuse returns low score for good matches
    }
}

const mockData: SearchDataItem[] = [
    { title: "Iphone 15 Pro", category: "Electronics", price: 999, description: "Latest apple phone", keywords: ["phone", "mobile"] },
    { title: "Samsung Galaxy S24", category: "Electronics", price: 899, description: "Android flagship", keywords: ["android"] },
    { title: "Macbook Air", category: "Laptop", price: 1200, description: "M3 chip laptop", keywords: ["notebook"] }
];

const config: AIConfig = {
    intents: [
        { name: 'check_price', patterns: ['price', 'cost', 'how much'] }
    ],
    boostingRules: [
        {
            condition: (item, ctx, intent) => intent === 'check_price' && item.category === 'Electronics',
            score: 15
        },
        {
            condition: (item: any, ctx: any) => ctx.userPreferences.brand === 'apple' && item.title.toLowerCase().includes('iphone'),
            score: 50
        }
    ]
};

const engine = new CoreEngine(mockData, MockFuse, config);

// Simulate User Interaction
console.log("--- Query 1: 'how much for a phone?' ---");
const res1 = engine.search("how much for a phone?");
console.log("Intent:", res1.intent);
console.log("Top Result:", res1.results[0]?.title);

// Simulate setting preference
console.log("\n--- Setting Brand Preference: Apple ---");
engine.setPreference('brand', 'apple');

console.log("--- Query 2: 'show me phones' ---");
const res2 = engine.search("show me phones");
console.log("Context Preference:", res2.context.userPreferences.brand);
console.log("Top Result (should be Iphone due to boost):", res2.results[0]?.title);
console.log("Score:", res2.confidence);
