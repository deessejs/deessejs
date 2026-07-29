# Vercel AI SDK

## Decision

**Vercel AI SDK** (`ai` and `@ai-sdk/*` packages) as the foundation for every LLM feature in the repo.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

Vercel AI SDK is used by:

- The AI primitives module (`apps/template/packages/ai/`) — every LLM call.
- The web app's streaming chat UI (`apps/template/apps/web/app/(app)/chat/` or wherever it lands).
- The agent loop executor (`apps/template/packages/ai/agent.ts`).

Vercel AI SDK is **not** used by:

- Non-LLM code paths (auth, billing, etc.).
- The CLI (the CLI doesn't make LLM calls directly).

## What Vercel AI SDK gives us

1. **Provider abstraction.** OpenAI, Anthropic, Google, Groq, Mistral, Ollama, OpenRouter — all behind one API.
2. **Structured output (Zod-native).** `generateObject({ schema: zodSchema })` is first-class. Critical for our AI primitives (feature 17.9).
3. **Token streaming.** `streamText` with React hooks (`useChat`, `useCompletion`). Streaming UI primitives out of the box.
4. **Multi-modal input.** Text, image, audio — native.
5. **Tool calling.** Function-calling with type safety.
6. **Agent loops.** `generateText({ maxSteps: N, tools: {...} })` for multi-step reasoning.
7. **Active development.** The team ships fast.

## Why Vercel AI SDK (not raw provider SDKs, not LangChain, not LlamaIndex)

| Alternative | Why not |
|---|---|
| **Raw provider SDKs (openai, anthropic-ai)** | We'd reimplement the abstraction for every provider. Per-tenant cost tracking and rate limiting become per-provider. |
| **LangChain** | Heavy framework, opinionated chains, our needs are simpler. |
| **LlamaIndex** | RAG-focused. We deferred RAG to v2. |
| **Vercel AI SDK + LangChain together** | Redundant. Vercel AI SDK covers what we need without LangChain's chains. |
| **DIY abstraction over providers** | Reinventing Vercel AI SDK badly. |

Vercel AI SDK wins because:

- **Provider abstraction is the floor**, not a wrapper we build.
- **Zod-native structured output** matches our validation layer.
- **Streaming UI primitives** are React-first (matches our Next.js stack).
- **Per-tenant cost tracking** (feature 17.15) is straightforward: we wrap the Vercel AI SDK calls with our metering layer.

## Providers we support

Per feature 17.2-17.8:

| Provider | Status |
|---|---|
| **OpenAI** | Default |
| **Anthropic (Claude)** | ✅ |
| **Google Gemini** | ✅ |
| **OpenRouter** | ✅ (any-to-any) |
| **Groq** | ✅ (fast inference) |
| **Mistral** | ✅ (EU buyers) |
| **Ollama (local)** | Dev/test only. Production uses provider APIs. |

The buyer picks their provider(s) at deploy time. API keys are per-tenant in the database (feature 17.15).

## Per-tenant metering (the wedge)

Every LLM call goes through our metering wrapper:

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { meter } from '@deessejs/ai/meter';

const meteredOpenAI = meter(openai, {
  tenantId: org.id,
  meter: 'llm.tokens',
  // price per 1M tokens, looked up from the billing config
});

const { text } = await generateText({
  model: meteredOpenAI('gpt-4o'),
  prompt: '...',
});
```

The metering layer:

1. Counts input + output tokens.
2. Records the call against the tenant's meter (Upstash Redis).
3. Enforces per-tenant budgets (hard caps per feature 17.16).
4. Enforces per-tenant rate limits (feature 17.17).
5. Bills via Stripe metered usage (feature 3.5).

This is the **only** way LLM calls should happen in the template. Direct calls to provider SDKs are forbidden in code review.

## Deferred to v2

- **RAG / vector DB** (17.20-17.23) — architecture reserved, no provider wired in.
- **Observability** (17.24) — buyer-wired (Langfuse, Helicone, LangSmith).
- **Evals** (17.25) — paired with observability in v2.
- **Fine-tuning** (17.26) — out of scope.
- **Voice agents as primary modality** (17.27) — out of scope.

## Constraints

- **All LLM calls go through the metering wrapper.** No direct provider calls.
- **Structured output uses Zod schemas.** No `any` types in the prompt-response boundary.
- **Streaming is the default for user-facing completions.** Non-streaming only for background jobs.
- **Per-tenant cost is logged.** Every call produces an audit event (who, what model, how many tokens, how much cost).

## Cross-references

- [`../10-decisions/0006-rag-vector-db-deferred.md`](../10-decisions/) — the ADR for RAG deferral (when written).
- [`../../product/features/17-ai-primitives.md`](../../product/features/17-ai-primitives.md) — the AI primitives feature inventory.
- [`../../product/features/03-billing.md`](../../product/features/03-billing.md) — usage-based pricing for LLM tokens.
- [`./upstash-redis-realtime.md`](./upstash-redis-realtime.md) — the metering backend.
