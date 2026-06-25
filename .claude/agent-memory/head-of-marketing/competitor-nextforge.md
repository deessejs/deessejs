---
name: competitor-nextforge
description: NextForge (next-forge.com, vercel/next-forge) — the official Vercel Next.js SaaS template, MIT licensed and free. The biggest missing competitor in our existing analysis as of 2026-06-24.
metadata:
  type: reference
---

# NextForge — The Official Vercel Template (MIT, Free)

> **⚠️ IMPORTANT — Previous memory conflated Nexty ($188, nexty.dev) with NextForge (free, MIT).** These are TWO DIFFERENT PRODUCTS. See [[reference-competitor-marketing]] for Nexty. This file is NextForge only.

## What it is

- **Name:** next-forge
- **Creator:** Hayden Bleasel — hired by Vercel, now **Member of Technical Staff @ OpenAI** (per LinkedIn, 2026)
- **Owner:** `vercel/next-forge` — Vercel still owns the repo, lists it on `vercel.com/templates`
- **License:** **MIT, free forever** (no paid tier, no pro plan, no enterprise)
- **Version:** v6 (released 2026-03-13), currently v6.0.2
- **GitHub:** 7,102 stars · 660 forks · 70 contributors · 367 releases · last push 2026-05-28
- **Positioning:** "Production-grade Turborepo template for Next.js apps" — Fast, Cheap, Opinionated, Modern, Safe

## Stack

Next.js + Turborepo + Bun (default) · Tailwind + shadcn/ui + TWBlocks · Clerk (auth) · Prisma + Neon (DB) · Stripe subscription (no metered usage) · Resend + React Email · Sentry + BetterStack · Arcjet (security) · BaseHub (CMS) · Mintlify (docs) · Vercel AI SDK (`packages/ai`)

## The AI / agent story (what they ship)

- ✅ `packages/ai` wrapping Vercel AI SDK (`streamText`, `useChat`, `models.chat`)
- ✅ AI Chatbot example (single-tenant, no metering)
- ✅ **next-forge skill** (v6) — `npx skills add vercel/next-forge` installs agent skill
- ✅ AI Agent Rules for Cursor + Copilot (PR #371)
- ✅ Vercel AI SDK's `tool-loop-agent` available (multi-step)

## What they DON'T ship (this is the wedge)

- ❌ **Per-tenant LLM metering** — single `model: models.chat`, no per-org cost tracking
- ❌ **Usage-based billing for LLM costs** — Stripe is subscription-only
- ❌ **Tenant-aware tool-calling contract** — tools are app-local
- ❌ **Human-in-the-loop checkpoints**
- ❌ **MCP server** — relies on AI SDK tool-calling instead

## Pricing

**Free. MIT licensed. No paid tier.** This is the hardest comparison: you cannot win on price.

## The defensible counter

> "NextForge is a template you download once. DeesseJS is a system your agents run on — with per-tenant metering, Stripe metered usage, and a Cloud you don't have to operate. The free template gives you features. The paid system gives you a business model."

## Strategic implications

1. **`/vs/next-forge` is now the #1 priority comparison page.** Default search result for "Next.js SaaS template."
2. **Ship `npx skills add deessejs/deessejs`** for parity. Low-effort, high-signal.
3. **Lean harder on the business-model wedge** (metering + billing + Cloud), not the agent-feature wedge.
4. **The Vercel halo is enormous.** We cannot beat them on default positioning. Win on monetization, not on completeness.

## Hayden Bleasel trajectory

- Created next-forge independently → hired by Vercel → now MTS @ OpenAI
- Vercel still owns the repo, lists it on templates page
- Risk to NextForge: primary maintainer is now at OpenAI (potential conflict of interest for a Vercel product)

## Sources

Pulled via `fresh` CLI on 2026-06-24:
- https://github.com/vercel/next-forge
- https://www.next-forge.com/
- https://vercel.com/templates/next.js/next-forge
- https://vercel.com/changelog/next-forge-6
- https://github.com/vercel/next-forge/pull/371
- https://haydenbleasel.com/
- https://www.linkedin.com/in/haydenbleasel