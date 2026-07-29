---
name: vercel-platform
description: Vercel product catalog snapshot (July 2026) — full-stack agentic platform, Fluid compute, Vercel Services for multi-framework projects. Companion to [[deploy]].
metadata:
  type: project
---

# Vercel platform — July 2026 snapshot

Vercel is now a **full-stack agentic cloud platform**, not just a Next.js host. This template deploys to Vercel via [[deploy]], so the platform's evolving surface area directly shapes what we can build without leaving the vendor.

**Why:** Major 2026 pivot — formerly "frontend host for Next.js", now pitched as "Agentic Infrastructure" (vercel.com homepage tagline). Affects whether we self-host backends, run agents, or need a separate queue/workflow/DB layer.

**How to apply:** Before suggesting a non-Vercel service (separate queue, separate workflow engine, separate AI gateway, separate compute for agents), check if Vercel already has a first-party primitive. Mitchell Hashimoto (Terraform co-creator) joined the board in March 2026 — infra credibility is intentional.

## Pivotal recent launches

- **Vercel Services** (June 30, 2026) — declare multiple frameworks in one project via `vercel.json` `services` key. Frontend + FastAPI/Flask/Django + Go/Rust in atomic deploys. Internal `bindings` for service-to-service traffic (no public internet, no CORS). Functions up to 30 min on Pro.
- **Fluid compute** (default since April 23, 2025) — concurrent invocations share an instance, error isolation, `waitUntil` for background work, cross-AZ then cross-region failover.
- **Active CPU pricing** — pay for CPU time actually running, not idle. Critical for AI/idle-heavy workloads.
- **Vercel Workflow** — durable multi-step JS/TS/Python with `'use workflow'` / `'use step'` directives. Pause/resume minutes-to-months, deterministic replays.
- **Vercel Sandbox** — Firecracker microVM for untrusted code (agents, code-gen). Up to 24h on Pro. Persistent by default.
- **AI Gateway** — single endpoint for hundreds of models, zero markup, automatic failover. Compatible with OpenAI / Anthropic / AI SDK v5/v6.
- **Vercel Connect** — OIDC short-lived credentials replaces long-lived secrets for Slack/GitHub/managed DBs.

## Product catalog (vercel.com/docs/products)

**Build with AI**: AI Gateway, AI SDK, Sandbox, Container Registry (VCR), Workflow, Vercel Agent, v0, Vercel MCP, AI Integrations.

**Deploy & scale**: Deployments, CLI, Functions, Delivery Network (CDN), Storage (Postgres/Blob/KV), Integrations (100+), Microfrontends, Domains.

**Operate & protect**: Firewall (L3/L4/L7), Observability, Feature Flags, Toolbar, Bot Management, BotID, Deployment Protection, Compliance (SOC 2 / HIPAA / ISO).

## Runtime support

Fluid compute runs Node.js, Python, Edge, Bun, Rust. Vercel Services auto-detects Next.js, FastAPI, Flask, Django, Express, Hono, Go, Rust servers.

## Staleness warning

Vercel ships features constantly. This snapshot is **2026-07-07**. Before recommending against a "we'd need X" assumption, verify against current docs — the product that didn't exist last quarter is probably here. The April 2026 Context.ai supply-chain breach exposed that Vercel's own internal posture is a moving target too.

## Related

- [[deploy]] — per-app Vercel project setup, dashboard overrides, `engines.node >=20` and cache-bust quirk
- [[stack]] — pnpm/Turbo monorepo that Vercel builds