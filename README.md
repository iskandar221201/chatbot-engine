# Assistant-in-a-Box (Enterprise Edition) 🤖💎

**The Ultimate Sales-Driven Chatbot Framework.**
Server-side ready, extensible, secure, and designed to convert leads into customers.

---

## 🚀 Why this library?

Unlike standard chatbots that just "chat", this engine is **engineered for sales**. It proactively identifies buying intent, scores leads, matches budgets, and helps you close deals.

Now with **Enterprise Features**:
- 🔌 **Middleware Pipeline**: Intercept & modify every request/response.
- 📊 **Analytics Telemetry**: Native hooks for Google Analytics / Datadog.
- 🛡️ **Security Guard**: XSS & SQLi protection built-in.
- 🇮🇩 **Indonesian NLP**: Native parsing for dates ("besok"), numbers ("2.5jt"), and sentiment.
- 🖥️ **Server-Side Ready**: Runs on Node.js, Bun, Deno, or Browser.

---

## 📦 Installation

```bash
npm install assistant-in-a-box
```

## ⚡ Quick Start

### 1. Server-Side (Node.js)

```typescript
import { AssistantEngine, ConfigLoader, LeadScoring } from 'assistant-in-a-box';

// Load config from .env
const config = ConfigLoader.loadFromEnv();
const engine = new AssistantEngine(products, Fuse, config);

// Search with Intent Detection
const result = await engine.search("Cari HP gaming budget 5jt");

// Check Lead Quality
if (LeadScoring.isHotLead("saya mau beli sekarang!")) {
    console.log("🔥 HOT LEAD DETECTED!");
}
```

### 2. Client-Side (Browser)

```html
<script src="dist/index.global.js"></script>
<script>
    const app = new Assistant.AssistantController(productData);
    app.openAssistant();
</script>
```

---

## 💎 Enterprise Features

### Middleware System
Extensibility without touching core code.
```typescript
const mw = new MiddlewareManager();
mw.useRequest(async (ctx, next) => {
    ctx.query = ctx.query.toLowerCase(); // Modify query
    await next();
});
```

### Structured Logging
JSON logs with auto-redaction for sensitive data.
```json
{"level":"info", "message":"Login", "context":{"password":"[REDACTED]"}}
```

### Analytics Hooks
Track what matters.
```typescript
analytics.onEvent(e => {
    if (e.type === 'sales_conversion') sendToCRM(e.payload);
});
```

---

## 📚 Documentation

Full API Reference and Guides available in [DOCUMENTATION.md](./DOCUMENTATION.md).

## 🧪 Testing

This library is battle-tested with **89 Automated Tests**.

```bash
npm test
```

## License
MIT
