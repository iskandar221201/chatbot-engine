# Assistant-in-a-Box: Technical Documentation 📚

This guide provides a comprehensive overview of how to configure and deploy the generic Assistant library for any landing page.

---

## 1. Architecture Overview

The library is split into three main layers:

- **Type System (`types.ts`)**: Defines the data structures for search items, results, and configuration.
- **Engine Layer (`engine.ts`)**: Handles the "intelligence" – query preprocessing, phonetic auto-correct, semantic expansion, and composite scoring.
- **Controller Layer (`controller.ts`)**: Manages the Chat UI, DOM events, and session persistence (`localStorage`).

---

## 2. Setting Up the Data (JSON)

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
    "image_url": "https://...",
    "is_recommended": true
  }
]
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
The most powerful feature. Directs the engine to prioritize specific categories based on detected entities or tokens.
```typescript
intentRules: [
    {
        intent: "contact_us",
        conditions: { 
            tokens: ["contact", "call"],
            entities: ["isLocation"] 
        }
    }
]
```

---

## 4. UI Implementation

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
import { AssistantController } from "./library";
import Fuse from "fuse.js"; // Or from CDN

const app = new AssistantController(myData, Fuse, selectors, config);
app.openAssistant(); // Open manually if needed
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

## 7. How to Publish to NPM 📦

Untuk mendaftarkan library ini ke NPM agar bisa di-install di project lain (seperti `npm install assistant-in-a-box`), ikuti langkah berikut:

1. **Siapkan Akun**: 
   Daftar di [npmjs.com](https://www.npmjs.com/) jika belum punya.

2. **Login di Terminal**:
   ```bash
   npm login
   ```

3. **Ganti Nama Paket**:
   Buka `library/package.json`, ganti `"name": "@your-scope/assistant-in-a-box"` dengan nama unik Anda (misal `"name": "al-bait-assistant"`).

4. **Build Library**:
   Library ini menggunakan TypeScript, jadi harus di-compile dulu ke JavaScript:
   ```bash
   cd library
   npm install
   npm run build
   ```

5. **Publish**:
   ```bash
   npm publish --access public
   ```

Setelah itu, siapapun bisa menggunakannya dengan:
`npm install nama-paket-anda`
