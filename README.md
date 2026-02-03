# AI Search Core Library 🧠

A **Context-Aware, Intent-Driven Search Engine** designed for any domain (E-commerce, Travel, SaaS, etc.).

This library provides a flexible "brain" for your search bar. Unlike standard search engines (Algolia, Fuse.js) that only match text, **AI Search Core** understands:
1.  **Context**: Remembers what the user just saw or asked.
2.  **Intent**: Detects if user wants to "buy", "compare", or "find info".
3.  **Preferences**: Boosts results based on user stats (e.g., "Apple fan", "Budget shopper").

## Installation

```bash
npm install ai-search-core fuse.js
```

## Quick Start

### 1. Define your Data
Your data can be anything. We just need a standard structure to index.

```typescript
const products = [
  { id: 1, title: 'iPhone 15', category: 'Smartphone', price: 999 },
  { id: 2, title: 'MacBook Air', category: 'Laptop', price: 1200 },
  { id: 3, title: 'Samsung S24', category: 'Smartphone', price: 899 },
];
```

### 2. Configure the Brain
Define how the AI should "think".

```typescript
import { CoreEngine, AIConfig } from 'ai-search-core';
import Fuse from 'fuse.js';

const config: AIConfig = {
    // 1. Synonym Mapping
    synonyms: {
        'hp': ['smartphone', 'phone', 'mobile'],
        'mac': ['macbook', 'laptop']
    },

    // 2. Define Intents (What is the user trying to do?)
    intents: [
        { name: 'check_price', patterns: ['how much', 'price', 'cost', 'biaya'] },
        { name: 'compare', patterns: ['vs', 'difference', 'compare', 'beda'] }
    ],

    // 3. Boosting Rules (Business Logic)
    boostingRules: [
        // Rule: If asking for price, boost items with prices displayed
        { 
            condition: (item, ctx, intent) => intent === 'check_price' && item.price > 0,
            score: 20 
        },
        // Rule: If user is an "Apple Fan" (tracked in context), boost Apple products
        {
            condition: (item, ctx) => ctx.userPreferences.brand === 'Apple' && item.title.includes('iPhone'),
            score: 50 
        }
    ]
};
```

### 3. Initialize & Search

```typescript
const engine = new CoreEngine(products, Fuse, config);

// Simulation
const result = engine.search("berapa harga hp?");

console.log(result.intent); // 'check_price'
console.log(result.results); // [iPhone 15, Samsung S24, ...] (Boosted by intent)
```

## Advanced Features

### Context Memory
The engine remembers the conversation turn-by-turn.

```typescript
// Turn 1
engine.search("Lihat iPhone 15"); 
// Engine remembers: lastTopic = 'Smartphone', lastItem = 'iPhone 15'

// Turn 2 (Follow-up)
engine.search("Warnanya apa aja?");
// Engine knows "Warnanya" refers to "iPhone 15" from previous turn.
```

### Setting User Preferences Dynamically
You can feed external signals into the engine (e.g., from buttons or user profile).

```typescript
// User clicked "Apple" filter button in UI
engine.setPreference('brand', 'Apple');

// Next search will heavily boost Apple products due to the BoostingRule we defined above.
engine.search("laptop terbaik"); // -> MacBook will be top result
```

## API Reference

### `CoreEngine`
- `constructor(data, FuseClass, config)`
- `search(query: string): SearchResult`
- `setPreference(key, value): void`

### `AIConfig`
- `synonyms`: `Record<string, string[]>`
- `stopWords`: `string[]`
- `intents`: `IntentDefinition[]`
- `boostingRules`: `BoostingRule[]`

## License
MIT
