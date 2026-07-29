# `/vs/next-forge` — Comparison Page Draft

> **Status:** Draft v1, ready for design + dev. Sources: github.com/vercel/next-forge, next-forge.com, vercel.com/changelog/next-forge-6. Verified 2026-06-24.
>
> **Target URL:** deessejs.com/vs/next-forge
>
> **Positioning:** Honest comparison. Don't disparage NextForge (Vercel halo + free = easy to lose optics). Reframe around business model.
>
> **Internal links out:** /, /pricing, /docs/agents, /docs/billing, /vs/supastarter, /vs/makerkit
>
> **Internal links in:** Homepage "See how we compare" section, /vs/supastarter "See also" footer, comparison-page hub (v3)

---

## Hero

# NextForge vs. DeesseJS: Free Template or Paid Agent System?

**TL;DR:** NextForge is a free, MIT-licensed Next.js template maintained by Vercel. DeesseJS is a paid agent system with per-tenant LLM metering, Stripe metered usage, and a managed Cloud. They're built for different jobs — this page helps you pick the right one.

| | NextForge | DeesseJS |
|---|---|---|
| **Price** | Free (MIT) | $249 – $899 one-time |
| **License** | MIT (yours to keep, modify, redistribute) | Proprietary (full source included) |
| **Maintainer** | Vercel (officially listed template) | DeesseJS team |
| **GitHub stars** | 7,100+ | New |
| **Best for** | "I want a comprehensive free template to build on" | "I want to charge my users for what my AI agents do" |
| **AI features** | Yes (Vercel AI SDK + agent skill) | Yes (agent primitives + per-tenant metering) |
| **Per-tenant LLM metering** | ❌ | ✅ |
| **Stripe metered usage for agent costs** | ❌ | ✅ |
| **Managed Cloud variant** | ❌ | ✅ (M8+) |

---

## Overview

**NextForge** is the official Next.js SaaS template published by Vercel. Created by Hayden Bleasel, it ships a Turborepo monorepo with 7 apps (`web`, `app`, `api`, `docs`, `email`, `storybook`, `studio`), 18+ shared packages (auth via Clerk, DB via Prisma + Neon, payments via Stripe, observability via Sentry + BetterStack), and a batteries-included philosophy: Fast, Cheap, Opinionated, Modern, Safe. As of v6 (March 2026), it also ships an installable agent skill (`npx skills add vercel/next-forge`) and AI Agent Rules for Cursor and Copilot. The license is MIT — free forever, no paid tier.

**DeesseJS** is a paid agent system — a Next.js SaaS template where the AI agents are the executors, not the buyers. Every surface (auth, billing, jobs, storage, notifications, API) ships with tool-calling primitives that your agents invoke directly. It includes per-tenant LLM cost tracking and Stripe metered usage for agent costs, so you can charge your users for what their agents do. The license is proprietary, but the source code is fully included. Prices range from $249 (Starter) to $899 (Team), with a 14-day money-back guarantee.

They share a foundation — both are Next.js + Turborepo monorepos with comprehensive batteries. They diverge on **what the batteries are for**: NextForge optimises for *developer velocity*, DeesseJS optimises for *agent revenue*.

---

## Feature comparison

| Feature | NextForge | DeesseJS |
|---|---|---|
| **License** | MIT (free) | Proprietary (paid, source included) |
| **Price** | Free | $249 – $899 one-time |
| **14-day money-back guarantee** | N/A | ✅ |
| **Framework** | Next.js + Turborepo + Bun | Next.js + Turborepo |
| **Auth** | Clerk | Better Auth |
| **Database** | Prisma + Neon | Prisma + Drizzle |
| **Payments** | Stripe (subscription) | Stripe (per-seat + **metered usage for agent costs**) |
| **Email** | Resend + React Email | Resend + React Email |
| **Observability** | Sentry + BetterStack | Trigger.dev + observability |
| **Security** | Arcjet (app-level rate limits) | Arcjet-equivalent + **per-tenant rate limits** |
| **Multi-tenancy** | Clerk orgs | Built-in (orgs + projects + tenants) |
| **AI package** | Vercel AI SDK (`streamText`, `useChat`) | Agent primitives (`tool-calling`, `multi-step loops`, **per-tenant metering**) |
| **Installable agent skill** | ✅ `npx skills add vercel/next-forge` | ✅ `npx skills add deessejs/deessejs` (planned) |
| **AI Agent Rules (Cursor, Copilot)** | ✅ | ✅ (AGENTS.md + rules) |
| **MCP server** | ❌ (uses Vercel AI SDK tool-calling) | ✅ |
| **Per-tenant LLM cost tracking** | ❌ | ✅ |
| **Usage-based billing for LLM costs** | ❌ | ✅ Stripe metered usage wired |
| **Human-in-the-loop checkpoints** | ❌ | ✅ |
| **Agent-cost chargeback to your users** | ❌ | ✅ |
| **AI Chatbot example** | ✅ (single-tenant, demo only) | ✅ (multi-tenant, production-ready) |
| **Multi-step agent workflow example** | Partial (via AI SDK tool-loop-agent) | ✅ (billed per tenant) |
| **Managed Cloud variant** | ❌ | ✅ (M8+) |
| **Live demo** | ✅ (4 demo URLs) | Coming (M4) |
| **/showcase (customer projects)** | Demo apps | ✅ (founding members + sponsored builders) |
| **Free tier** | The whole product is free | Lite (open-source subset, auth + billing + agent primitives) |
| **Updates** | Continuous (367 releases to date) | Lifetime, included |
| **Commercial support** | Community (GitHub) | Founder direct line + Discord (Team tier) |

---

## Who should choose NextForge

- **You want a comprehensive free template** with batteries included and don't need to charge users for AI usage. MIT means you own everything forever.
- **You're building for yourself or a single tenant** — there's no per-tenant metering requirement.
- **You prefer Clerk over Better Auth** — Clerk's out-of-box UX is excellent and their docs are mature.
- **You want to be on the Vercel-default stack** — NextForge integrates with Vercel deployments, Neon databases, and Vercel AI SDK in a way that's hard to beat for that specific toolchain.
- **You don't need to monetise agent costs** — you're charging flat subscriptions or per-seat, not per-token or per-agent-action.

NextForge is a great choice when your business model is "charge users for access" rather than "charge users for what their agents do."

---

## Who should choose DeesseJS

- **You want to charge your users for what their AI agents do** — per-tenant metering + Stripe metered usage is the entire point.
- **You're building a multi-tenant SaaS** where each customer's agents run independently and generate independent costs.
- **You want a managed Cloud** so you don't operate auth, billing, database, and storage infrastructure yourself.
- **You need agent primitives that agents call** — `deesse.auth.createUser()`, `deesse.billing.createSubscription()`, `deesse.jobs.enqueue()`. Not just AI SDK wrappers; a wired system your agents run on.
- **You want paid commercial support** — Discord, founder direct line, 14-day guarantee, paid roadmap influence.
- **You need MCP server integration** — NextForge uses Vercel AI SDK tool-calling, not the MCP standard.

DeesseJS is the right choice when your business model is "my users pay for AI value delivered" and you need the metering, billing, and infrastructure to make that work without building it from scratch.

---

## The honest middle ground

If you're reading this, you might also be considering **not paying** and **assembling from NextForge + your own metering layer + your own billing wiring + your own Cloud**. That's a viable choice if:

- You have 3+ months of dev time
- Your metering and billing requirements are simple
- You're comfortable operating your own auth, DB, billing, and infrastructure
- You don't need the agent primitives contract (you'll build your own)

**The DeesseJS value proposition:** We charge $249–$899 to save you 3+ months of building the metering, billing, and Cloud layer on top of a free template. If your time is worth more than that, the math works out.

---

## FAQ

**Q: Is NextForge really free? What's the catch?**
A: Yes, MIT licensed, free forever. No paid tier, no upsell, no enterprise plan. Hayden Bleasel (creator) accepts GitHub Sponsors. Vercel lists it on their templates page. The catch is that it's a template — you operate the result yourself.

**Q: Why pay for DeesseJS if NextForge is free?**
A: If your business model is "charge users for what their AI agents do," you need per-tenant LLM metering + Stripe metered usage + a managed Cloud. NextForge doesn't ship any of those. DeesseJS does. The $249–$899 is the cost of not building it yourself.

**Q: Does DeesseJS use NextForge under the hood?**
A: No. DeesseJS is a separate codebase. We share the Next.js + Turborepo foundation but our architecture is independent.

**Q: Can I migrate from NextForge to DeesseJS?**
A: Yes. Both are Next.js + Turborepo monorepos, so the package boundaries map cleanly. We provide a migration guide at `/docs/migrate/next-forge`. The big differences: auth (Clerk → Better Auth), docs (Mintlify → Fumadocs), AI primitives (Vercel AI SDK wrappers → agent primitives contract).

**Q: Does DeesseJS work with the Vercel AI SDK?**
A: Yes. DeesseJS's `packages/ai` can wrap the Vercel AI SDK for streaming, multi-modal, and provider abstraction. We add on top: tool-calling primitives against the wired system, per-tenant metering, multi-step agent loops with human-in-the-loop checkpoints.

**Q: Will NextForge add agentic features like DeesseJS?**
A: NextForge v6 already added an installable agent skill (`npx skills add vercel/next-forge`) and AI Agent Rules for Cursor/Copilot. As of 2026-06-24, they still don't ship per-tenant LLM metering or usage-based billing. We're watching this space — if Vercel ships those, our counter-message shifts to "we ship it now, not on roadmap."

**Q: Is there a free version of DeesseJS?**
A: Yes — DeesseJS Lite. It's an open-source subset with auth, billing, and agent primitives. Download from `github.com/deessejs/lite`. The paid template adds the full monorepo, all packages, admin, docs, i18n, E2E, Figma UI Kit, and lifetime updates.

**Q: What about DeesseJS Cloud?**
A: Coming Q3 2026. Managed variant of DeesseJS — your agents run on infrastructure we operate. Join the waitlist for private beta access.

---

## Related comparisons

- [Supastarter vs. DeesseJS](/vs/supastarter) — for paid SaaS template comparison
- [MakerKit vs. DeesseJS](/vs/makerkit) — for MCP server + AI agent rules comparison
- [ShipFast vs. DeesseJS](/vs/shipfast) — for "ship fast" comparison

---

## SEO metadata

- **Title tag:** NextForge vs. DeesseJS: Free Vercel template or paid agent system? (2026)
- **Meta description:** Honest comparison of NextForge (free, MIT, Vercel) and DeesseJS (paid, per-tenant LLM metering, Stripe metered usage, managed Cloud). Same foundation, different jobs.
- **H1:** NextForge vs. DeesseJS: Which one should you choose?
- **Primary keyword:** next-forge vs deessejs
- **Secondary keywords:** next-forge alternative, paid next.js saas template, per-tenant llm metering, stripe metered usage agent costs
- **Schema:** Product comparison (JSON-LD)
- **Internal link targets (must link out):** /, /pricing, /docs/agents, /docs/billing, /vs/supastarter, /vs/makerkit
- **Internal link sources (must link in):** homepage footer "See how we compare", pricing page "vs. competitors" section, /vs/supastarter "See also", /vs/makerkit "See also"

---

**Honest framing rules (apply to all comparison pages):**
- Never disparage NextForge. Vercel halo + free = lose optics if you attack.
- Acknowledge where NextForge wins (free, MIT, Vercel-distributed, comprehensive).
- Frame DeesseJS's advantages as **category difference**, not feature war.
- Link generously to NextForge (signals confidence, not weakness).