# 17. AI primitives

> Vercel AI SDK is the floor. "Available, well-built" — not the headline. The differentiators are per-tenant cost tracking, per-tenant budgets, and human-in-the-loop agent checkpoints. RAG / observability / evals deferred to v2.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 17.1 | Vercel AI SDK (provider abstraction) | ✅ | C | The floor |
| 17.2 | OpenAI provider | ✅ | C | Default |
| 17.3 | Anthropic provider | ✅ | C | Claude |
| 17.4 | Google Gemini provider | ✅ | C | |
| 17.5 | OpenRouter provider | ✅ | C | Any-to-any |
| 17.6 | Groq provider | ✅ | U | Fast inference |
| 17.7 | Mistral provider | ✅ | U | EU buyers |
| 17.8 | Ollama (local) provider | 🟡 | U | Dev/test, not production |
| 17.9 | Structured output (Zod) | ✅ | C | First-class, not an afterthought |
| 17.10 | Token streaming | ✅ | C | Real-time, UI primitives |
| 17.11 | Multi-modal input (text, image, audio) | ✅ | C | Vercel AI SDK native |
| 17.12 | Tool calling | ✅ | C | Vercel AI SDK native |
| 17.13 | Agent loops (multi-step) | ✅ | C | `generateText` with `maxSteps` |
| 17.14 | Human-in-the-loop checkpoints | ✅ | D | Pause an agent, ask for approval, resume. **TurboStarter doesn't ship this; we do.** |
| 17.15 | Per-tenant cost tracking | ✅ | D | **Meter every LLM call against the tenant.** Differentiation per 3.5 / 3.19. |
| 17.16 | Per-tenant token budgets (hard caps) | ✅ | D | Enforce max spend per org |
| 17.17 | Per-tenant rate limiting (LLM calls) | ✅ | D | Configurable per plan |
| 17.18 | Conversation history | ✅ | C | Stored in our DB, not the provider's |
| 17.19 | Streaming UI primitives (drop-in components) | ✅ | C | Chat, completion, multi-step |
| 17.20 | Vector DB / RAG | 🔵 | — | Architecture reserved in v1 (ingestion / chunking / retrieval interfaces); no provider wired in. Re-evaluate post-launch. |
| 17.21 | Embeddings | 🔵 | — | Cascade with 17.20. |
| 17.22 | Document ingestion | 🔵 | — | Cascade. |
| 17.23 | Retrieval | 🔵 | — | Cascade. |
| 17.24 | Observability & tracing (Langfuse / Helicone) | ⚪ | — | Buyer adds their own. We document the integration. |
| 17.25 | Evals (Promptfoo) | ⚪ | — | Cascade with 17.24. v2. |
| 17.26 | Fine-tuning | ⚪ | — | Out of scope. Buyer uses OpenAI / Anthropic dashboards. |
| 17.27 | Voice agents (primary modality) | ⚪ | — | Out of scope. Multi-modal input is in. |
| 17.28 | Image / video generation | 🟡 | U | Architecture supports (Vercel AI SDK); shipped as examples in the demo app |

**Notes:**
- The AI story is **"available, well-built"** — not the headline. The wedge is the overall product.
- 17.14, 17.15, 17.16, 17.17 (per-tenant cost / budgets / rate limits) are the real AI differentiators. Multi-tenant LLM apps need this; almost no template ships it.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../positioning.md`](../positioning.md) — AI is "available, well-built," not headline
- Deep dive: [`../research.md`](../research.md) — buyer-voice on AI depth
- Related: [03-billing.md](./03-billing.md) — usage-based pricing for LLM tokens (3.5, 3.19)
- Related: [04-background-jobs.md](./04-background-jobs.md) — agent loops run as jobs
- Related: [20-cross-cutting.md](./20-cross-cutting.md) — per-tenant context for cost tracking
