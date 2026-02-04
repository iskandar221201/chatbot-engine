# Assistant-in-a-Box 🤖💎

**Sales-Driven by Default.** A lightweight, high-conversion chatbot engine for any landing page.

This library transforms your static "Search Data" into a proactive sales assistant. It understands intent, handles typos, expands synonyms, and **prioritizes products when users show buying intent.**

## Features
- 💰 **Sales-Driven Scoring**: Automatically boosts products with prices, discounts, or "Recommended" tags when transaction keywords (buy, price, promo) are detected.
- 🌍 **Universal Language Support**: Built-in support for Indonesian & English, fully customizable for any other language.
- 🚀 **Hybrid Remote Mode**: Search locally for speed or fetch from multiple APIs in parallel (Laravel, CodeIgniter, etc.) with auto-merging.
- 🎨 **Lush UI Components**: Includes a complete chat controller with badge animations, price comparison cards, and high-visibility CTAs.
- 🔒 **Secure-by-Design**: Integrated support for custom Auth headers and Server-Side Proxy patterns.
- 🕷️ **Site Crawler**: Auto-discovery module that crawls your website to find new products and content dynamically.

## Quick Start (Demo)

The easiest way to see the assistant in action is to check the included demo:

1. Open `demo/index.html` in your browser.
2. Explore `demo/assistant-config.js` to see how search behavior is customized.
3. Modify `demo/sample-data.js` to inject your own product data.

## Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies (for development/testing)
npm install

# Run Unit Tests
npm test

# Build for production
npm run build
```

## Why different?
Unlike standard search bars that just show matching text, **Assistant-in-a-Box** calculates a "Business relevance" score. If a user asks *"How much is it?"*, the engine won't just look for the word "how", it will proactively identify that the user is ready to buy and push your best-priced products to the top with a "Pesan Sekarang" button.

## Documentation
For full technical details, configuration options (Phonetic mapping, Intent Rules, Proxy Setup), and deployment checklists, see [DOCUMENTATION.md](./DOCUMENTATION.md).

## License
MIT
