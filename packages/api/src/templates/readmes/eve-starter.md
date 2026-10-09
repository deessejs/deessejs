# Eve Starter

Starter template for building, running, and shipping AI agents with eve (by Vercel).

## Stack

- **Framework:** Next.js 16 (App Router)
- **Agent runtime:** eve (Vercel)
- **Model providers:** OpenAI, Anthropic, xAI — swappable via adapters
- **Tool calling:** oRPC end-to-end typed tools

## Getting started

```bash
deessejs init eve-starter
cd eve-starter
pnpm install
pnpm dev
```

## What's in the box

- Reference agent wired against the Vercel model gateway
- Tooling examples: web search, file fetch, RAG over a Postgres knowledge base
- Streaming UI primitives built on `react-markdown`
- Eval harness under `evals/` for offline regression
- Tracing via OpenTelemetry-compatible exporters
