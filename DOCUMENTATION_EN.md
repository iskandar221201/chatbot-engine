# Assistant-in-a-Box: Technical Documentation 📚

This guide provides a comprehensive overview of the Enterprise Sales-Driven Chatbot Engine.

---

## 1. Architecture Overview

The library is a modular enterprise framework:

- **Type System (`src/types.ts`)**: Core data structures.
- **Engine Layer (`src/engine.ts`)**: Fuzzy logic, NLP scoring, and intent detection.
- **Sales Intelligence (`src/lib/lead-scoring.ts`, `src/lib/sales-psychology.ts`)**: Modules for scoring and psychology.
- **Enterprise Layer (`src/lib/analytics.ts`, `src/lib/sentiment.ts`)**: Telemetry, emotion detection, and logic.
- **Sub-Engines (`src/lib/...`)**: Modular units for specific logic (ContextEngine, IntentOrchestrator, ResponseEngine, PreprocessingEngine, ScoringEngine, QueryOrchestrator, SecurityGuard).
- **Core Libs (`src/lib/middleware.ts`, `src/lib/logger.ts`)**: Extensibility and observability.

---

## 2. Server-Side Integration (Node.js) 🆕

The library is now **100% Server-Side Ready** (Node.js/Bun/Deno).

### Configuration via Environment Variables
Create a `.env` file in your project root:

```bash
# Security
AIB_SECURITY_MAX_LENGTH=1000
AIB_SECURITY_STRICT_MODE=true

# Sales Intelligence
AIB_SALES_HOT_THRESHOLD=75
AIB_SALES_WEIGHT_INTENT=35

# Performance
AIB_SESSION_TIMEOUT_MIN=60
```

Load the configuration in your application:
```typescript
import { AssistantEngine, ConfigLoader } from 'assistant-in-a-box';

const config = ConfigLoader.loadFromEnv();
const engine = new AssistantEngine(data, Fuse, config);
```

---

## 3. Sales-Driven Modules 💰

Key features to increase sales conversion.

### A. Lead Scoring
Evaluate users based on intent (buy/ask), urgency (caps/exclamation), and engagement.

```typescript
import { LeadScoring } from 'assistant-in-a-box';
const scorer = new LeadScoring();
const result = scorer.score('want to order now, urgent!');

// result.grade -> 'hot'
// result.score -> 85
```

### B. Budget Matcher
Automatically detect user budget and match products.

```typescript
import { BudgetMatcher } from 'assistant-in-a-box';
const matcher = new BudgetMatcher();
const matches = matcher.match('looking for phone budget 3 million', productList);

// matches.suggestion -> "There are 3 products matching your 3m budget..."
```

### C. Follow-Up Suggester
Provide suggested follow-up questions to help closing.

```typescript
import { FollowUpSuggester } from 'assistant-in-a-box';
const suggester = new FollowUpSuggester();
const questions = suggester.suggest('sales_price');
// -> ["Is this budget fixed?", "Want info on installments?"]
```

---

## 4. Enterprise Features 🏢

### A. Middleware Pipeline (Interceptor)
Intercept requests/responses for custom logic (similar to Express.js).

```typescript
import { MiddlewareManager } from 'assistant-in-a-box';
const mw = new MiddlewareManager();

// Middleware: Auto-Translate Query
mw.useRequest(async (ctx, next) => {
    ctx.query = await translateToIndonesian(ctx.query);
    await next();
});

// Middleware: Filter Out of Stock Results
mw.useResponse(async (result, ctx, next) => {
    result.results = result.results.filter(item => item.stock > 0);
    await next();
});
```

### B. Analytics & Telemetry
Hook data events to Google Analytics or Datadog.

```typescript
import { AnalyticsEngine } from 'assistant-in-a-box';
const analytics = new AnalyticsEngine();

analytics.onEvent((event) => {
    console.log(`[${event.type}]`, event.payload);
    // Send to external API
});
```

### C. SecurityGuard
Input protection from XSS and basic SQL Injection attacks. The engine uses this module automatically on every request before the search process.

```typescript
import { SecurityGuard } from 'assistant-in-a-box';

// Manual Input Sanitization
const safeQuery = SecurityGuard.clean('<script>alert(1)</script> Hello'); // -> " Hello"

// Configuration via Engine
const engine = new AssistantEngine(data, undefined, {
    security: {
        maxLength: 500,
        strictMode: true // Reject request if threats detected
    }
});
```

### D. Structured Logger
Standard JSON logging for production.

```typescript
import { logger } from 'assistant-in-a-box';
logger.info('Search performed', { query: 'iphone', userId: '123' });
```

### E. Sentiment Analysis Config 🎭
Custom dictionary to detect emotions specific to your industry.

```typescript
import { SentimentAnalyzer } from 'assistant-in-a-box';

const analyzer = new SentimentAnalyzer({
    positiveWords: { 'awesome': 3, 'great': 2 },
    negativeWords: { 'bad': 3, 'slow': 2 },
    urgencyWords: ['emergency', 'immediately']
});

const result = analyzer.analyze('This is awesome!'); 
// -> High positive score
```

### F. Sales Reporter Config 📊
Adjust revenue assumptions and intent mapping.

```typescript
import { SalesReporter } from 'assistant-in-a-box';

const reporter = new SalesReporter(analyticsEngine, {
    currencySymbol: 'USD',
    avgOrderValue: 50, // Average order value $50
    leadConversionRate: 0.2 // Assume 20% lead closing
});

console.log(reporter.getHtmlSummary());
```

### G. Sentiment-Aware & Adaptive Response 🎭
The bot adjusts its tone based on customer emotions (Positive/Negative).

```typescript
const engine = new AssistantEngine(data, undefined, {
    sentiment: {
        positiveWords: { 'great': 3 },
        negativeWords: { 'disappointed': 3 }
    },
    sentimentPrefixes: {
        negative: ["We apologize for the inconvenience.", "So sorry to hear that."],
        positive: ["That's great! ", "Glad to hear that! "]
    }
});
```
> [!TIP]
> If a **negative** sentiment is detected, the engine will automatically insert a sympathetic *Objection Prefix* before providing the answer to address customer concerns.


### H. Intent Orchestration (IntentOrchestrator) 🧠
All intent detection is managed by `IntentOrchestrator`, combining AI (NLP Classifier) with hierarchical Rule-based triggers.

```typescript
import { IntentOrchestrator } from 'assistant-in-a-box';

const orchestrator = new IntentOrchestrator({
    threshold: 0.8, // AI Strictness
    salesTriggers: { 'custom': ['special order'] }
});

// Used internally by the Engine, but accessible:
const intent = engine.intentOrchestrator.detect(query, tokens, stemmedTokens);
```

### I. Hybrid AI (LLM) Config 🤖
Connect with OpenAI or other models (compatible endpoint).

```typescript
import { HybridAI } from 'assistant-in-a-box';

const ai = new HybridAI({
    apiKey: 'sk-xxx',
    model: 'gpt-4',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    systemPrompt: 'You are a trendy shoe store customer service.'
});
```

### J. Smart Reference Resolution (ContextEngine) 🧠
The engine uses the `ContextEngine` sub-engine to understand follow-up questions without re-stating the subject (e.g., "how much is it?").

```typescript
// Direct access to sub-engine
const engine = new AssistantEngine(data);
const currentState = engine.context.getState(); 

// Configuration via Engine
const engineWithRef = new AssistantEngine(data, undefined, {
    // Keywords that trigger subject resolution from history
    referenceTriggers: ['how much', 'price', 'stock', 'features', 'color']
});
```
> [!TIP]
> **Entity Locking**: If the engine finds a result with high confidence (>80%), the sub-engine will "lock" that subject for subsequent conversation references until the user explicitly changes the topic.


### K. Relevancy & Ranking (ScoringEngine) ⚖️
Search result evaluation logic (Dice Coefficient, weighting, contextual boosting) is managed by `ScoringEngine`. This allows switching ranking algorithms without changing the search flow.

### L. Search Orchestration (QueryOrchestrator) 🧠
The "brain" of the search pipeline that coordinates all sub-engines (Preprocessing -> Intent -> Scoring -> Response). It also handles *Compound Query* splitting and coordination between local/remote searches.

### M. Search Transparency (Scoring Breakdown) 🔍
Every search result now includes a `scoreBreakdown` explaining the evaluation weights:

```typescript
const result = await engine.search("samsung galaxy");
console.log(result.scoreBreakdown);
/* Output:
{
  fuzzyMatch: 9,
  tokenMatch: 25,
  fieldBoost: 50,
  contextBoost: 0,
  psychologyBoost: 30,
  intentBoost: 20,
  penalty: 0
}
*/
```

### N. Performance Optimization (Memoization) ⚡
`PreprocessingEngine` automatically performs *memoization* (caching) on Indonesian text stemming. This significantly reduces CPU load when handling repeated queries or long texts.

---

## 5. Indonesian NLP Core 🇮🇩

The library includes a built-in specialized Indonesian parser.

### Date Parser
Understand natural time expressions.
- "Besok" (Tomorrow) -> Date object (T+1)
- "Minggu depan" (Next week) -> Date object (T+7)
- "Tanggal 15" -> Date object (15th of current month)

### Number Parser
Understand Indonesian currency formats.
- "2.5jt" -> 2500000
- "500rb" -> 500000
- "seratus ribu" -> 100000

### Sentiment Analyzer
Detect customer emotions and urgency.
- "Kecewa berat!!" -> Negative + Urgent
- "Bagus banget" -> Positive + High Intensity

---

## 6. Frontend Integration (Legacy)

For browser usage (non-Node.js), the UI Controller and Crawler features are still available.

### Quick Start (Browser)
```html
<script src="dist/index.global.js"></script>
<script>
    const app = new Assistant.AssistantController(data);
    app.openAssistant();
</script>
```

See [Quick Start V1](#) in legacy documentation for UI customization details.

---

## 7. Production Checklist 🚀

1. [ ] **Environment**: Set `.env` for sales threshold & security configurations.
2. [ ] **Telemetry**: Ensure `AnalyticsEngine` is connected to your monitoring dashboard.
3. [ ] **Security**: Enable `AIB_SECURITY_STRICT_MODE` on production servers.
4. [ ] **Caching**: Use `CacheManager` under high traffic.
5. [ ] **Minify**: Use build `dist/index.js` (CJS) or `dist/index.mjs` (ESM).
