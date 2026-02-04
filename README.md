# Assistant-in-a-Box 🤖💎

![Release](https://img.shields.io/badge/release-v1.1.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

**Sales-Driven by Default.** A lightweight, high-conversion chatbot engine for any landing page.

This library transforms your static "Search Data" into a proactive sales assistant. It understands intent, handles typos, expands synonyms, and **prioritizes products when users show buying intent.**

## Features
- 💰 **Sales-Driven Scoring**: Automatically boosts products with prices, discounts, or "Recommended" tags when transaction keywords (buy, price, promo) are detected.
- 🌍 **Universal Language Support**: Built-in support for Indonesian & English, fully customizable for any other language.
- 🚀 **Hybrid Remote Mode**: Search locally for speed or fetch from multiple APIs in parallel (Laravel, CodeIgniter, etc.) with auto-merging.
- 🎨 **Lush UI Components**: Includes a complete chat controller with badge animations, price comparison cards, and high-visibility CTAs.
- 🔒 **Secure-by-Design**: Integrated support for custom Auth headers and Server-Side Proxy patterns.

## Getting Started

### Option 1: Using CDN (Recommended for Browsers)
Simply add the script to your HTML and initialize the assistant.

```html
<script src="https://cdn.jsdelivr.net/npm/assistant-in-a-box/dist/index.global.js"></script>
<script>
  const app = new Assistant.AssistantController(myData, undefined, selectors, config);
</script>
```

### Option 2: Using NPM
```bash
npm install assistant-in-a-box
```

```typescript
import { AssistantController } from 'assistant-in-a-box';
```

## Visual Demo
Check out the `index.html` in this repository for a premium landing page example featuring the Assistant in action.

## Why different?
Unlike standard search bars that just show matching text, **Assistant-in-a-Box** calculates a "Business relevance" score. If a user asks *"How much is it?"*, the engine won't just look for the word "how", it will proactively identify that the user is ready to buy and push your best-priced products to the top with a "Pesan Sekarang" button.

## Documentation
For full configuration (Phonetic mapping, Intent Rules, Proxy Setup), see [DOCUMENTATION.md](./DOCUMENTATION.md).

## Contributing
Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License
MIT
