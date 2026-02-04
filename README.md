# Assistant-in-a-Box 🤖💎

**Sales-Driven by Default.** A lightweight, high-conversion chatbot engine for any landing page.

This library transform your static "Search Data" into a proactive sales assistant. It understands intent, handles typos, expands synonyms, and **prioritizes products when users show buying intent.**

## Features
- 💰 **Sales-Driven Scoring**: Automatically boosts products with prices, discounts, or "Recommended" tags when transaction keywords (buy, price, promo) are detected.
- 🌍 **Universal Language Support**: Built-in support for Indonesian & English, fully customizable for any other language.
- 🚀 **Hybrid Remote Mode**: Search locally for speed or fetch from multiple APIs in parallel (Laravel, CodeIgniter, etc.) with auto-merging.
- 🎨 **Lush UI Components**: Includes a complete chat controller with badge animations, price comparison cards, and high-visibility CTAs.
- 🔒 **Secure-by-Design**: Integrated support for custom Auth headers and Server-Side Proxy patterns.

## Getting Started

Since this is a private library, follow these steps to integrate:

1. **Copy Files**: Download or clone the `/library` folder into your project's assets/lib directory.
2. **Setup Data**: Create a `search-data.json` following the `AssistantDataItem` structure.
3. **Initialize**:

```typescript
import { AssistantController } from './lib/assistant/index';

const app = new AssistantController(myData, undefined, selectors, {
    whatsappNumber: '62812345678',
    salesTriggers: {
        'beli': ['order', 'pesan', 'ambil']
    }
});

app.openAssistant();
```

## Why different?
Unlike standard search bars that just show matching text, **Assistant-in-a-Box** calculates a "Business relevance" score. If a user asks *"How much is it?"*, the engine won't just look for the word "how", it will proactively identify that the user is ready to buy and push your best-priced products to the top with a "Pesan Sekarang" button.

## Documentation
For full configuration (Phonetic mapping, Intent Rules, Proxy Setup), see [DOCUMENTATION.md](./DOCUMENTATION.md).

## License
MIT
